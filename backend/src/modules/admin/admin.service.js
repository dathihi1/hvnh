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
  { userName, email, password, university, studentId, phoneNumber, role = "student" },
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
      studentId: true,
      phoneNumber: true,
      status: true,
    },
  });

  const assignedRole = await assignRole(user.userId, role);

  return { ...user, role: assignedRole };
};

// ─── CSV import ───────────────────────────────────────────────────────────────

const REQUIRED_COLUMNS = ["userName", "email", "password", "university"];

const parseCSV = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new AppError("VALIDATION_ERROR", "CSV must have a header row and at least one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
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
  const rows = parseCSV(csvText);
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

module.exports = { getOverviewStats, getActivityStats, createUser, importUsersFromCSV };
