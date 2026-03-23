const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const { resolveFields, resolveArrayFields, resolveNested } = require("../../utils/s3-helpers");

const USER_SELECT = {
  userId: true,
  userName: true,
  studentId: true,
  university: true,
  faculty: true,
  className: true,
  phoneNumber: true,
  email: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
};

// ─── Get users (admin, paginated) ───────────────────────────────────────────

const getUsers = async ({ page = 1, limit = 20, search, status, university }) => {
  const where = {
    isDeleted: false,
    ...(status && { status }),
    ...(university && { university: { contains: university, mode: "insensitive" } }),
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
        ...USER_SELECT,
        userRoles: {
          where: { isDeleted: false },
          select: { role: { select: { code: true, roleName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  await resolveArrayFields(data, ["avatarUrl"]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get user by ID ─────────────────────────────────────────────────────────

const getUserById = async (userId) => {
  const user = await prisma.user.findFirst({
    where: { userId: Number(userId), isDeleted: false },
    select: {
      ...USER_SELECT,
      userRoles: {
        where: { isDeleted: false },
        select: { role: { select: { code: true, roleName: true } } },
      },
    },
  });

  if (!user) throw new AppError("USER_NOT_FOUND");
  await resolveFields(user, ["avatarUrl"]);

  const roles = (user.userRoles || []).map((ur) => ur.role?.code).filter(Boolean);
  const { userRoles, ...rest } = user;
  return { ...rest, roles };
};

// ─── Update own profile ─────────────────────────────────────────────────────

const updateProfile = async (userId, data) => {
  const user = await prisma.user.findFirst({
    where: { userId, isDeleted: false },
  });
  if (!user) throw new AppError("USER_NOT_FOUND");

  const updated = await prisma.user.update({
    where: { userId },
    data: { ...data, updatedBy: userId, updatedAt: new Date() },
    select: USER_SELECT,
  });
  await resolveFields(updated, ["avatarUrl"]);
  return updated;
};

// ─── Update user status (admin) ─────────────────────────────────────────────

const updateUserStatus = async (userId, status, updatedBy) => {
  const user = await prisma.user.findFirst({
    where: { userId: Number(userId), isDeleted: false },
  });
  if (!user) throw new AppError("USER_NOT_FOUND");

  return prisma.user.update({
    where: { userId: Number(userId) },
    data: { status, updatedBy, updatedAt: new Date() },
    select: USER_SELECT,
  });
};

// ─── Soft delete user (admin) ───────────────────────────────────────────────

const softDeleteUser = async (userId, deletedBy) => {
  const user = await prisma.user.findFirst({
    where: { userId: Number(userId), isDeleted: false },
  });
  if (!user) throw new AppError("USER_NOT_FOUND");

  return prisma.user.update({
    where: { userId: Number(userId) },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy },
  });
};

// ─── Get user's activities (registrations) ──────────────────────────────────

const getUserActivities = async (userId, { page = 1, limit = 20 }) => {
  const where = { userId, isDeleted: false };

  const [data, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: {
        activity: {
          select: {
            activityId: true,
            activityName: true,
            activityStatus: true,
            startTime: true,
            endTime: true,
            location: true,
            organization: { select: { organizationId: true, organizationName: true } },
          },
        },
      },
      orderBy: { registrationTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.registration.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get user's organizations ───────────────────────────────────────────────

const getUserOrganizations = async (userId) => {
  const members = await prisma.organizationMember.findMany({
    where: { userId, isDeleted: false },
    include: {
      organization: {
        select: {
          organizationId: true,
          organizationName: true,
          organizationType: true,
          logoUrl: true,
        },
      },
    },
  });

  for (const m of members) {
    if (m.organization) await resolveFields(m.organization, ["logoUrl"]);
  }

  return members;
};

// ─── Lookup user by email (for team member search) ──────────────────────────

const lookupByEmail = async (email) => {
  if (!email) return null;
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, isDeleted: false },
    select: {
      userId: true,
      userName: true,
      email: true,
      studentId: true,
      phoneNumber: true,
      avatarUrl: true,
      university: true,
    },
  });
  if (!user) return null;
  await resolveFields(user, ["avatarUrl"]);
  return user;
};

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  updateUserStatus,
  softDeleteUser,
  getUserActivities,
  getUserOrganizations,
  lookupByEmail,
};
