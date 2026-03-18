const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const { ACTIVITY_STATUS, VALID_STATUS_TRANSITIONS } = require("../../utils/constants");
const { isAdminOrOrgLeader } = require("../../utils/permissions");

// ─── Create activity ────────────────────────────────────────────────────────

const createActivity = async (data, userId, roles) => {
  const { teamRule, ...activityData } = data;

  // Verify organization exists
  const org = await prisma.organization.findFirst({
    where: { organizationId: activityData.organizationId, isDeleted: false },
  });
  if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");

  // Permission check
  const hasPermission = await isAdminOrOrgLeader(roles, activityData.organizationId, userId);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  // Verify category exists
  const category = await prisma.activityCategory.findFirst({
    where: { categoryId: activityData.categoryId, isDeleted: false },
  });
  if (!category) throw new AppError("CATEGORY_NOT_FOUND");

  const activity = await prisma.activity.create({
    data: {
      ...activityData,
      activityStatus: ACTIVITY_STATUS.DRAFT,
      createdBy: userId,
    },
  });

  // Create team rule if provided
  if (teamRule && (activityData.teamMode === "team" || activityData.teamMode === "both")) {
    await prisma.activityTeamRule.create({
      data: {
        activityId: activity.activityId,
        minTeamMembers: teamRule.minTeamMembers,
        maxTeamMembers: teamRule.maxTeamMembers,
      },
    });
  }

  return prisma.activity.findUnique({
    where: { activityId: activity.activityId },
    include: {
      category: true,
      organization: { select: { organizationId: true, organizationName: true } },
      activityTeamRule: true,
    },
  });
};

// ─── Get activities (paginated with filters) ────────────────────────────────

const getActivities = async ({
  page = 1, limit = 20, search, categoryId, organizationId,
  activityStatus, activityType, startDate, endDate,
  sortBy = "createdAt", sortOrder = "desc",
}) => {
  const where = {
    isDeleted: false,
    ...(search && { activityName: { contains: search, mode: "insensitive" } }),
    ...(categoryId && { categoryId }),
    ...(organizationId && { organizationId }),
    ...(activityStatus && { activityStatus }),
    ...(activityType && { activityType }),
    ...(startDate && { startTime: { gte: startDate } }),
    ...(endDate && { startTime: { ...(startDate ? { gte: startDate } : {}), lte: endDate } }),
  };

  // Handle combined date filter
  if (startDate && endDate) {
    where.startTime = { gte: startDate, lte: endDate };
  }

  const [data, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        category: { select: { categoryId: true, categoryName: true } },
        organization: { select: { organizationId: true, organizationName: true, logoUrl: true } },
        _count: {
          select: { registrations: { where: { isDeleted: false } } },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get activity by ID ─────────────────────────────────────────────────────

const getActivityById = async (activityId) => {
  const activity = await prisma.activity.findFirst({
    where: { activityId: Number(activityId), isDeleted: false },
    include: {
      category: true,
      organization: { select: { organizationId: true, organizationName: true, logoUrl: true } },
      activityTeamRule: true,
      _count: {
        select: {
          registrations: { where: { isDeleted: false } },
        },
      },
    },
  });

  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");
  return activity;
};

// ─── Update activity ────────────────────────────────────────────────────────

const updateActivity = async (activityId, data, userId, roles) => {
  const activity = await prisma.activity.findFirst({
    where: { activityId: Number(activityId), isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  // Can only edit draft or published
  if (![ACTIVITY_STATUS.DRAFT, ACTIVITY_STATUS.PUBLISHED].includes(activity.activityStatus)) {
    throw new AppError("ACTIVITY_CANNOT_MODIFY");
  }

  const hasPermission = await isAdminOrOrgLeader(roles, activity.organizationId, userId);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  const { teamRule, ...updateData } = data;

  // Verify category if changing
  if (updateData.categoryId) {
    const category = await prisma.activityCategory.findFirst({
      where: { categoryId: updateData.categoryId, isDeleted: false },
    });
    if (!category) throw new AppError("CATEGORY_NOT_FOUND");
  }

  const updated = await prisma.activity.update({
    where: { activityId: Number(activityId) },
    data: { ...updateData, updatedBy: userId, updatedAt: new Date() },
  });

  // Upsert team rule
  if (teamRule) {
    await prisma.activityTeamRule.upsert({
      where: { activityId: Number(activityId) },
      create: {
        activityId: Number(activityId),
        minTeamMembers: teamRule.minTeamMembers,
        maxTeamMembers: teamRule.maxTeamMembers,
      },
      update: {
        minTeamMembers: teamRule.minTeamMembers,
        maxTeamMembers: teamRule.maxTeamMembers,
      },
    });
  }

  return prisma.activity.findUnique({
    where: { activityId: Number(activityId) },
    include: {
      category: true,
      organization: { select: { organizationId: true, organizationName: true } },
      activityTeamRule: true,
    },
  });
};

// ─── Update activity status ─────────────────────────────────────────────────

const updateActivityStatus = async (activityId, newStatus, userId, roles) => {
  const activity = await prisma.activity.findFirst({
    where: { activityId: Number(activityId), isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  const hasPermission = await isAdminOrOrgLeader(roles, activity.organizationId, userId);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  // Validate transition
  const validTransitions = VALID_STATUS_TRANSITIONS[activity.activityStatus] || [];
  if (!validTransitions.includes(newStatus)) {
    throw new AppError("ACTIVITY_INVALID_TRANSITION");
  }

  return prisma.activity.update({
    where: { activityId: Number(activityId) },
    data: { activityStatus: newStatus, updatedBy: userId, updatedAt: new Date() },
  });
};

// ─── Soft delete activity ───────────────────────────────────────────────────

const softDeleteActivity = async (activityId, userId, roles) => {
  const activity = await prisma.activity.findFirst({
    where: { activityId: Number(activityId), isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  const hasPermission = await isAdminOrOrgLeader(roles, activity.organizationId, userId);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  return prisma.activity.update({
    where: { activityId: Number(activityId) },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
  });
};

// ─── Categories ─────────────────────────────────────────────────────────────

const getCategories = async () => {
  return prisma.activityCategory.findMany({
    where: { isDeleted: false },
    orderBy: { categoryName: "asc" },
  });
};

const createCategory = async (data, createdBy) => {
  return prisma.activityCategory.create({
    data: { ...data, createdBy },
  });
};

// ─── Checkin sessions ───────────────────────────────────────────────────────

const createCheckinSession = async (activityId, data, userId, roles) => {
  const activity = await prisma.activity.findFirst({
    where: { activityId: Number(activityId), isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  const hasPermission = await isAdminOrOrgLeader(roles, activity.organizationId, userId);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  return prisma.activityCheckin.create({
    data: {
      activityId: Number(activityId),
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime || null,
    },
  });
};

const getCheckinSessions = async (activityId) => {
  const activity = await prisma.activity.findFirst({
    where: { activityId: Number(activityId), isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  return prisma.activityCheckin.findMany({
    where: { activityId: Number(activityId) },
    include: {
      _count: { select: { registrationCheckins: true } },
    },
    orderBy: { checkInTime: "desc" },
  });
};

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  updateActivityStatus,
  softDeleteActivity,
  getCategories,
  createCategory,
  createCheckinSession,
  getCheckinSessions,
};
