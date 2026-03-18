const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const { APPLICATION_RESULT, ORG_MEMBER_ROLE } = require("../../utils/constants");
const { isAdminOrOrgLeader } = require("../../utils/permissions");

// ─── Create application ─────────────────────────────────────────────────────

const createApplication = async ({ activityId, note }, userId) => {
  // Verify activity exists
  const activity = await prisma.activity.findFirst({
    where: { activityId, isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  // Check duplicate
  const existing = await prisma.clubApplication.findUnique({
    where: { activityId_userId: { activityId, userId } },
  });
  if (existing && !existing.isDeleted) {
    throw new AppError("APPLICATION_DUPLICATE");
  }

  // Re-activate if soft-deleted, or create new
  if (existing && existing.isDeleted) {
    return prisma.clubApplication.update({
      where: { applicationId: existing.applicationId },
      data: {
        result: APPLICATION_RESULT.PENDING,
        note: note || null,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        submittedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      },
      include: {
        activity: { select: { activityId: true, activityName: true, organization: { select: { organizationId: true, organizationName: true } } } },
      },
    });
  }

  return prisma.clubApplication.create({
    data: {
      activityId,
      userId,
      note: note || null,
      result: APPLICATION_RESULT.PENDING,
      createdBy: userId,
    },
    include: {
      activity: { select: { activityId: true, activityName: true, organization: { select: { organizationId: true, organizationName: true } } } },
    },
  });
};

// ─── Get my applications ────────────────────────────────────────────────────

const getMyApplications = async (userId, { page = 1, limit = 20, result }) => {
  const where = {
    userId,
    isDeleted: false,
    ...(result && { result }),
  };

  const [data, total] = await Promise.all([
    prisma.clubApplication.findMany({
      where,
      include: {
        activity: {
          select: {
            activityId: true,
            activityName: true,
            organization: { select: { organizationId: true, organizationName: true, logoUrl: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.clubApplication.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get applications by activity (admin/leader) ───────────────────────────

const getApplicationsByActivity = async (activityId, { page = 1, limit = 20, result }) => {
  const where = {
    activityId: Number(activityId),
    isDeleted: false,
    ...(result && { result }),
  };

  const [data, total] = await Promise.all([
    prisma.clubApplication.findMany({
      where,
      include: {
        user: { select: { userId: true, userName: true, email: true, studentId: true, avatarUrl: true } },
      },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.clubApplication.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get application by ID ──────────────────────────────────────────────────

const getApplicationById = async (applicationId) => {
  const application = await prisma.clubApplication.findFirst({
    where: { applicationId: Number(applicationId), isDeleted: false },
    include: {
      activity: {
        select: {
          activityId: true,
          activityName: true,
          organization: { select: { organizationId: true, organizationName: true } },
        },
      },
      user: { select: { userId: true, userName: true, email: true, studentId: true, avatarUrl: true } },
    },
  });

  if (!application) throw new AppError("APPLICATION_NOT_FOUND");
  return application;
};

// ─── Update application (accept/reject/interview) ──────────────────────────

const updateApplication = async (applicationId, data, userId, roles) => {
  const application = await prisma.clubApplication.findFirst({
    where: { applicationId: Number(applicationId), isDeleted: false },
    include: { activity: true },
  });
  if (!application) throw new AppError("APPLICATION_NOT_FOUND");

  // Only pending or interview can be updated
  if (![APPLICATION_RESULT.PENDING, APPLICATION_RESULT.INTERVIEW].includes(application.result)) {
    throw new AppError("APPLICATION_ALREADY_DECIDED");
  }

  const hasPermission = await isAdminOrOrgLeader(
    roles, application.activity.organizationId, userId
  );
  if (!hasPermission) throw new AppError("FORBIDDEN");

  const updated = await prisma.clubApplication.update({
    where: { applicationId: Number(applicationId) },
    data: {
      result: data.result,
      interviewTime: data.interviewTime || null,
      note: data.note !== undefined ? data.note : application.note,
      updatedBy: userId,
      updatedAt: new Date(),
    },
    include: {
      user: { select: { userId: true, userName: true, email: true } },
      activity: { select: { activityId: true, activityName: true, organizationId: true } },
    },
  });

  // Auto-add as organization member when accepted
  if (data.result === APPLICATION_RESULT.ACCEPTED) {
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: application.userId,
          organizationId: application.activity.organizationId,
        },
      },
      create: {
        userId: application.userId,
        organizationId: application.activity.organizationId,
        role: ORG_MEMBER_ROLE.MEMBER,
        joinDate: new Date(),
        createdBy: userId,
      },
      update: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        role: ORG_MEMBER_ROLE.MEMBER,
        joinDate: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  return updated;
};

// ─── Soft delete own application (only if pending) ──────────────────────────

const softDeleteApplication = async (applicationId, userId) => {
  const application = await prisma.clubApplication.findFirst({
    where: { applicationId: Number(applicationId), userId, isDeleted: false },
  });
  if (!application) throw new AppError("APPLICATION_NOT_FOUND");

  if (application.result !== APPLICATION_RESULT.PENDING) {
    throw new AppError("APPLICATION_ALREADY_DECIDED");
  }

  return prisma.clubApplication.update({
    where: { applicationId: Number(applicationId) },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
  });
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationsByActivity,
  getApplicationById,
  updateApplication,
  softDeleteApplication,
};
