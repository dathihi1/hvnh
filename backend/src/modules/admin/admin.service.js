const bcrypt = require("bcryptjs");

const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const { USER_STATUS } = require("../../utils/constants");

// ─── Stats ────────────────────────────────────────────────────────────────────

const getOverviewStats = async () => {
  const [totalUsers, activeUsers, totalActivities, totalOrganizations, totalRegistrations] =
    await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false, status: USER_STATUS.ACTIVE } }),
      prisma.activity.count({ where: { isDeleted: false } }),
      prisma.organization.count({ where: { isDeleted: false } }),
      prisma.registration.count({ where: { isDeleted: false } }),
    ]);

  return { totalUsers, activeUsers, totalActivities, totalOrganizations, totalRegistrations };
};

const getActivityStats = async () => {
  const [byStatus, byType] = await Promise.all([
    prisma.activity.groupBy({
      by: ["activityStatus"],
      where: { isDeleted: false },
      _count: { activityId: true },
    }),
    prisma.activity.groupBy({
      by: ["activityType"],
      where: { isDeleted: false },
      _count: { activityId: true },
    }),
  ]);

  return {
    byStatus: byStatus.map((s) => ({ status: s.activityStatus, count: s._count.activityId })),
    byType: byType.map((t) => ({ type: t.activityType, count: t._count.activityId })),
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assignRole = async (userId, roleCode) => {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) throw new AppError("VALIDATION_ERROR", `Role '${roleCode}' does not exist`);

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.roleId } },
    update: { isDeleted: false },
    create: { userId, roleId: role.roleId },
  });

  return role.code;
};

// ─── Create single user ───────────────────────────────────────────────────────

const createUser = async (
  { userName, email, password, university, faculty, className, studentId, phoneNumber, role = "student" },
  createdBy
) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("AUTH_EMAIL_EXISTS");

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      userName,
      email,
      password: hashed,
      university,
      faculty: faculty || null,
      className: className || null,
      studentId: studentId || null,
      phoneNumber: phoneNumber || null,
      status: USER_STATUS.ACTIVE,
      createdBy,
    },
    select: {
      userId: true,
      userName: true,
      email: true,
      university: true,
      faculty: true,
      className: true,
      studentId: true,
      phoneNumber: true,
      status: true,
    },
  });

  const assignedRole = await assignRole(user.userId, role);

  return { ...user, role: assignedRole };
};

// ─── CSV import ───────────────────────────────────────────────────────────────

const parseCSV = (csvText, requiredColumns = []) => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new AppError("VALIDATION_ERROR", "CSV must have a header row and at least one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const missing = requiredColumns.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new AppError("VALIDATION_ERROR", `Missing required columns: ${missing.join(", ")}`);
  }

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line, idx) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row = Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
      row._rowNum = idx + 2;
      return row;
    });
};

const importUsersFromCSV = async (csvText, createdBy) => {
  const rows = parseCSV(csvText, ["userName", "email", "password", "university"]);
  const results = { created: [], failed: [] };

  for (const row of rows) {
    const { _rowNum, ...data } = row;
    try {
      if (!data.userName || !data.email || !data.password || !data.university) {
        throw new Error("Missing required fields: userName, email, password, university");
      }
      const user = await createUser(
        {
          userName: data.userName,
          email: data.email,
          password: data.password,
          university: data.university,
          faculty: data.faculty || undefined,
          className: data.className || undefined,
          studentId: data.studentId || undefined,
          phoneNumber: data.phoneNumber || undefined,
          role: data.role || "student",
        },
        createdBy
      );
      results.created.push(user);
    } catch (err) {
      results.failed.push({ row: _rowNum, email: data.email, reason: err.message });
    }
  }

  return {
    total: rows.length,
    created: results.created.length,
    failed: results.failed.length,
    createdUsers: results.created,
    errors: results.failed,
  };
};

// ─── Monthly registration trend (last N months) ───────────────────────────

const getRegistrationTrend = async (months = 6) => {
  const rows = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', "registrationTime"), 'YYYY-MM') AS month,
      COUNT(*)::int AS total
    FROM registrations
    WHERE "isDeleted" = false
      AND "registrationTime" >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' * ${months - 1}
    GROUP BY DATE_TRUNC('month', "registrationTime")
    ORDER BY DATE_TRUNC('month', "registrationTime")
  `;

  return rows.map((r) => ({ month: r.month, total: r.total }));
};

// ─── Create single organization (+ auto-create leader account) ────────────────

const createOrganization = async (
  { organizationName, organizationType, email, description,
    leaderName, leaderEmail, leaderPassword, leaderUniversity, leaderPhoneNumber },
  createdBy
) => {
  // Check if leader email already exists
  const existingUser = await prisma.user.findUnique({ where: { email: leaderEmail } });
  if (existingUser) throw new AppError("AUTH_EMAIL_EXISTS", `Email '${leaderEmail}' đã tồn tại`);

  const hashedPassword = await bcrypt.hash(leaderPassword, 12);

  // Determine role based on org type
  const roleCode = organizationType === "club" ? "club" : "organization_leader";

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the organization
    const org = await tx.organization.create({
      data: {
        organizationName,
        organizationType,
        email: email || null,
        description: description || null,
        createdBy,
      },
      select: {
        organizationId: true,
        organizationName: true,
        organizationType: true,
        email: true,
        description: true,
      },
    });

    // 2. Create the leader user account
    const user = await tx.user.create({
      data: {
        userName: leaderName,
        email: leaderEmail,
        password: hashedPassword,
        university: leaderUniversity,
        phoneNumber: leaderPhoneNumber || null,
        status: USER_STATUS.ACTIVE,
        createdBy,
      },
      select: {
        userId: true,
        userName: true,
        email: true,
        university: true,
      },
    });

    // 3. Assign role
    const role = await tx.role.findUnique({ where: { code: roleCode } });
    if (role) {
      await tx.userRole.create({
        data: { userId: user.userId, roleId: role.roleId },
      });
    }

    // 4. Link user as president of the organization
    await tx.organizationMember.create({
      data: {
        userId: user.userId,
        organizationId: org.organizationId,
        role: "president",
        joinDate: new Date(),
        createdBy,
      },
    });

    return { organization: org, leader: { ...user, role: roleCode } };
  });

  return result;
};

// ─── CSV import organizations ──────────────────────────────────────────────────

const importOrgsFromCSV = async (csvText, createdBy) => {
  const rows = parseCSV(csvText, ["organizationName", "organizationType", "leaderName", "leaderEmail", "leaderPassword", "leaderUniversity"]);
  const results = { created: [], failed: [] };

  for (const row of rows) {
    const { _rowNum, ...data } = row;
    try {
      const result = await createOrganization(
        {
          organizationName: data.organizationName,
          organizationType: data.organizationType,
          email: data.email || undefined,
          description: data.description || undefined,
          leaderName: data.leaderName,
          leaderEmail: data.leaderEmail,
          leaderPassword: data.leaderPassword,
          leaderUniversity: data.leaderUniversity,
          leaderPhoneNumber: data.leaderPhoneNumber || undefined,
        },
        createdBy
      );
      results.created.push(result);
    } catch (err) {
      results.failed.push({ row: _rowNum, organizationName: data.organizationName, reason: err.message });
    }
  }

  return {
    total: rows.length,
    created: results.created.length,
    failed: results.failed.length,
    createdOrganizations: results.created,
    errors: results.failed,
  };
};

// ─── List users (admin) ────────────────────────────────────────────────────────
// type: "student" | "club" | "third_party" — map tới role/org type

const listUsers = async ({ page = 1, limit = 20, search, status, type } = {}) => {
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const where = {
    isDeleted: false,
    ...(status && { status }),
    ...(search && {
      OR: [
        { userName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        userId: true,
        userName: true,
        email: true,
        studentId: true,
        university: true,
        phoneNumber: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        userRoles: {
          where: { isDeleted: false },
          select: { role: { select: { code: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: data.map(({ userRoles, ...u }) => ({
      ...u,
      roles: userRoles.map((ur) => ur.role?.code).filter(Boolean),
    })),
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Update user (admin) ───────────────────────────────────────────────────────

const adminUpdateUser = async (userId, data, updatedBy) => {
  const user = await prisma.user.findFirst({ where: { userId: Number(userId), isDeleted: false } });
  if (!user) throw new AppError("USER_NOT_FOUND");

  const { password, ...updateData } = data;
  const payload = { ...updateData, updatedBy: Number(updatedBy), updatedAt: new Date() };

  if (password) {
    payload.password = await bcrypt.hash(password, 12);
  }

  return prisma.user.update({
    where: { userId: Number(userId) },
    data: payload,
    select: {
      userId: true, userName: true, email: true, studentId: true,
      university: true, phoneNumber: true, status: true, avatarUrl: true,
    },
  });
};

// ─── Delete user (admin) ───────────────────────────────────────────────────────

const adminDeleteUser = async (userId, deletedBy) => {
  const user = await prisma.user.findFirst({ where: { userId: Number(userId), isDeleted: false } });
  if (!user) throw new AppError("USER_NOT_FOUND");

  return prisma.user.update({
    where: { userId: Number(userId) },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy: Number(deletedBy) },
  });
};

// ─── Lock / unlock user (admin) ───────────────────────────────────────────────

const adminToggleUserStatus = async (userId, status, updatedBy) => {
  const user = await prisma.user.findFirst({ where: { userId: Number(userId), isDeleted: false } });
  if (!user) throw new AppError("USER_NOT_FOUND");

  return prisma.user.update({
    where: { userId: Number(userId) },
    data: { status, updatedBy: Number(updatedBy), updatedAt: new Date() },
    select: {
      userId: true, userName: true, email: true, status: true,
    },
  });
};

// ─── List organizations (admin) ────────────────────────────────────────────────

const listOrganizations = async ({ page = 1, limit = 20, search, organizationType, status } = {}) => {
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const where = {
    isDeleted: false,
    ...(organizationType && { organizationType }),
    ...(status && { status }),
    ...(search && { organizationName: { contains: search, mode: "insensitive" } }),
  };

  const [data, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      select: {
        organizationId: true, organizationName: true, organizationType: true,
        email: true, status: true, logoUrl: true, description: true, createdAt: true,
        _count: { select: { organizationMembers: { where: { isDeleted: false } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Update organization (admin) ──────────────────────────────────────────────

const adminUpdateOrganization = async (orgId, data, updatedBy) => {
  const org = await prisma.organization.findFirst({ where: { organizationId: Number(orgId), isDeleted: false } });
  if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");

  const { password, ...updateData } = data;
  const payload = { ...updateData, updatedBy: Number(updatedBy), updatedAt: new Date() };

  if (password) {
    payload.password = await bcrypt.hash(password, 12);
  }

  return prisma.organization.update({
    where: { organizationId: Number(orgId) },
    data: payload,
    select: {
      organizationId: true, organizationName: true, organizationType: true,
      email: true, status: true, logoUrl: true, description: true,
    },
  });
};

// ─── Delete organization (admin) ──────────────────────────────────────────────

const adminDeleteOrganization = async (orgId, deletedBy) => {
  const org = await prisma.organization.findFirst({ where: { organizationId: Number(orgId), isDeleted: false } });
  if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");

  return prisma.organization.update({
    where: { organizationId: Number(orgId) },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy: Number(deletedBy) },
  });
};

// ─── Lock / unlock organization (admin) ───────────────────────────────────────

const adminToggleOrgStatus = async (orgId, status, updatedBy) => {
  const org = await prisma.organization.findFirst({ where: { organizationId: Number(orgId), isDeleted: false } });
  if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");

  return prisma.organization.update({
    where: { organizationId: Number(orgId) },
    data: { status, updatedBy: Number(updatedBy), updatedAt: new Date() },
    select: { organizationId: true, organizationName: true, status: true },
  });
};

// ─── Promote user to admin, organization_leader, or club ──────────────────────

const promoteUser = async (userId, { role, organization } = {}, promotedBy) => {
  const user = await prisma.user.findFirst({ where: { userId: Number(userId), isDeleted: false } });
  if (!user) throw new AppError("USER_NOT_FOUND");

  if (role === "admin") {
    await assignRole(Number(userId), "admin");
    return { userId: Number(userId), role: "admin" };
  }

  if (role === "organization_leader" || role === "club") {
    if (!organization?.organizationName || !organization?.organizationType) {
      throw new AppError("VALIDATION_ERROR", "Tên và loại tổ chức/CLB là bắt buộc");
    }

    // Create org directly (without auto-creating user, since user already exists)
    const org = await prisma.organization.create({
      data: {
        organizationName: organization.organizationName,
        organizationType: organization.organizationType,
        email: organization.email || null,
        description: organization.description || null,
        createdBy: promotedBy,
      },
      select: {
        organizationId: true,
        organizationName: true,
        organizationType: true,
        email: true,
        description: true,
      },
    });

    const roleCode = role === "club" ? "club" : "organization_leader";
    await assignRole(Number(userId), roleCode);

    await prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId: Number(userId), organizationId: org.organizationId } },
      update: { isDeleted: false, role: "president", createdBy: promotedBy },
      create: {
        userId: Number(userId),
        organizationId: org.organizationId,
        role: "president",
        joinDate: new Date(),
        createdBy: promotedBy,
      },
    });

    return { userId: Number(userId), role: roleCode, organization: org };
  }

  throw new AppError("VALIDATION_ERROR", "Role phải là 'admin', 'organization_leader' hoặc 'club'");
};

module.exports = {
  getOverviewStats,
  getActivityStats,
  getRegistrationTrend,
  createUser,
  importUsersFromCSV,
  createOrganization,
  importOrgsFromCSV,
  listUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminToggleUserStatus,
  listOrganizations,
  adminUpdateOrganization,
  adminDeleteOrganization,
  adminToggleOrgStatus,
  promoteUser,
};
