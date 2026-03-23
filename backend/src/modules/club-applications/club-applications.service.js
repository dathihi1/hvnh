const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const { APPLICATION_RESULT, ORG_MEMBER_ROLE } = require("../../utils/constants");
const { isAdminOrOrgLeader } = require("../../utils/permissions");
const { resolveFields } = require("../../utils/s3-helpers");

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
    include: { activity: true, organization: true },
  });
  if (!application) throw new AppError("APPLICATION_NOT_FOUND");

  // Only pending or interview can be updated
  if (![APPLICATION_RESULT.PENDING, APPLICATION_RESULT.INTERVIEW].includes(application.result)) {
    throw new AppError("APPLICATION_ALREADY_DECIDED");
  }

  // Determine orgId: from activity-based or org-based application
  const orgId = application.activity?.organizationId ?? application.organizationId;
  const hasPermission = await isAdminOrOrgLeader(roles, orgId, userId);
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
      organization: { select: { organizationId: true, organizationName: true } },
    },
  });

  // Auto-add as organization member when accepted
  if (data.result === APPLICATION_RESULT.ACCEPTED && orgId) {
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: application.userId,
          organizationId: orgId,
        },
      },
      create: {
        userId: application.userId,
        organizationId: orgId,
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

// ─── Create org-based application (no activityId) ───────────────────────────

const createOrgApplication = async ({ organizationId, note }, userId) => {
  const org = await prisma.organization.findFirst({
    where: { organizationId: Number(organizationId), isDeleted: false },
  });
  if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");

  if (!org.isRecruiting) throw new AppError("ORGANIZATION_NOT_RECRUITING");

  const existing = await prisma.clubApplication.findUnique({
    where: { organizationId_userId: { organizationId: Number(organizationId), userId } },
  });
  if (existing && !existing.isDeleted) {
    throw new AppError("APPLICATION_DUPLICATE");
  }

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
        organization: { select: { organizationId: true, organizationName: true } },
      },
    });
  }

  return prisma.clubApplication.create({
    data: {
      organizationId: Number(organizationId),
      userId,
      note: note || null,
      result: APPLICATION_RESULT.PENDING,
      createdBy: userId,
    },
    include: {
      organization: { select: { organizationId: true, organizationName: true } },
    },
  });
};

// ─── Get my org application ──────────────────────────────────────────────────

const getMyOrgApplication = async (organizationId, userId) => {
  return prisma.clubApplication.findUnique({
    where: { organizationId_userId: { organizationId: Number(organizationId), userId } },
  });
};

// ─── Get applications by org (admin/leader) ──────────────────────────────────

const getApplicationsByOrg = async (organizationId, { page = 1, limit = 20, result, search } = {}) => {
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const where = {
    organizationId: Number(organizationId),
    isDeleted: false,
    ...(result && { result }),
    ...(search && {
      user: {
        OR: [
          { userName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { studentId: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.clubApplication.findMany({
      where,
      include: {
        user: { select: { userId: true, userName: true, email: true, studentId: true, avatarUrl: true } },
      },
      orderBy: { submittedAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.clubApplication.count({ where }),
  ]);

  for (const app of data) {
    if (app.user) await resolveFields(app.user, ["avatarUrl"]);
  }

  return {
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Accept form respondents as candidates (org-leader) ──────────────────────

const acceptFormRespondents = async (organizationId, userIds, operatorId) => {
  const orgId = Number(organizationId);

  const results = await Promise.all(
    userIds.map(async (uid) => {
      const userId = Number(uid);
      const existing = await prisma.clubApplication.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId } },
      });

      if (existing && !existing.isDeleted) {
        return { userId, status: "already_exists", applicationId: existing.applicationId };
      }

      if (existing && existing.isDeleted) {
        const updated = await prisma.clubApplication.update({
          where: { applicationId: existing.applicationId },
          data: {
            result: APPLICATION_RESULT.PENDING,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            submittedAt: new Date(),
            updatedBy: operatorId,
            updatedAt: new Date(),
          },
        });
        return { userId, status: "reactivated", applicationId: updated.applicationId };
      }

      const created = await prisma.clubApplication.create({
        data: {
          organizationId: orgId,
          userId,
          result: APPLICATION_RESULT.PENDING,
          createdBy: operatorId,
        },
      });
      return { userId, status: "created", applicationId: created.applicationId };
    })
  );

  return results;
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationsByActivity,
  getApplicationById,
  updateApplication,
  softDeleteApplication,
  createOrgApplication,
  getMyOrgApplication,
  getApplicationsByOrg,
  acceptFormRespondents,
};
