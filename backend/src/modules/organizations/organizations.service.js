const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const { ORG_MEMBER_ROLE } = require("../../utils/constants");
const { isAdminOrOrgLeader } = require("../../utils/permissions");

// ─── Create organization ────────────────────────────────────────────────────

const createOrganization = async (data, createdBy) => {
  const org = await prisma.organization.create({
    data: {
      ...data,
      createdBy,
    },
  });

  // Auto-add creator as president
  await prisma.organizationMember.create({
    data: {
      userId: createdBy,
      organizationId: org.organizationId,
      role: ORG_MEMBER_ROLE.PRESIDENT,
      joinDate: new Date(),
      createdBy,
    },
  });

  return prisma.organization.findUnique({
    where: { organizationId: org.organizationId },
    include: {
      organizationMembers: {
        where: { isDeleted: false },
        include: { user: { select: { userId: true, userName: true, email: true } } },
      },
    },
  });
};

// ─── Get organizations (paginated) ──────────────────────────────────────────

const getOrganizations = async ({ page = 1, limit = 20, search, organizationType }) => {
  const where = {
    isDeleted: false,
    ...(organizationType && { organizationType }),
    ...(search && {
      organizationName: { contains: search, mode: "insensitive" },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        _count: {
          select: {
            organizationMembers: { where: { isDeleted: false } },
            activities: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get organization by ID ─────────────────────────────────────────────────

const getOrganizationById = async (organizationId) => {
  const org = await prisma.organization.findFirst({
    where: { organizationId: Number(organizationId), isDeleted: false },
    include: {
      organizationMembers: {
        where: { isDeleted: false },
        include: { user: { select: { userId: true, userName: true, email: true, avatarUrl: true } } },
      },
      _count: {
        select: {
          activities: { where: { isDeleted: false } },
        },
      },
    },
  });

  if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");
  return org;
};

// ─── Update organization ────────────────────────────────────────────────────

const updateOrganization = async (organizationId, data, userId, roles) => {
  const org = await prisma.organization.findFirst({
    where: { organizationId: Number(organizationId), isDeleted: false },
  });
  if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");

  const hasPermission = await isAdminOrOrgLeader(roles, Number(organizationId), userId);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  return prisma.organization.update({
    where: { organizationId: Number(organizationId) },
    data: { ...data, updatedBy: userId, updatedAt: new Date() },
  });
};

// ─── Soft delete organization ───────────────────────────────────────────────

const softDeleteOrganization = async (organizationId, deletedBy) => {
  const org = await prisma.organization.findFirst({
    where: { organizationId: Number(organizationId), isDeleted: false },
  });
  if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");

  return prisma.organization.update({
    where: { organizationId: Number(organizationId) },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy },
  });
};

// ─── Get members ────────────────────────────────────────────────────────────

const getMembers = async (organizationId, { page = 1, limit = 20 }) => {
  const where = { organizationId: Number(organizationId), isDeleted: false };

  const [data, total] = await Promise.all([
    prisma.organizationMember.findMany({
      where,
      include: {
        user: { select: { userId: true, userName: true, email: true, avatarUrl: true, studentId: true } },
      },
      orderBy: { joinDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.organizationMember.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Add member ─────────────────────────────────────────────────────────────

const addMember = async (organizationId, userId, role, addedBy, callerRoles) => {
  const org = await prisma.organization.findFirst({
    where: { organizationId: Number(organizationId), isDeleted: false },
  });
  if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");

  const hasPermission = await isAdminOrOrgLeader(callerRoles, Number(organizationId), addedBy);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  // Check user exists
  const user = await prisma.user.findFirst({
    where: { userId: Number(userId), isDeleted: false },
  });
  if (!user) throw new AppError("USER_NOT_FOUND");

  // Check if already member (including soft-deleted)
  const existing = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: Number(userId),
        organizationId: Number(organizationId),
      },
    },
  });

  if (existing && !existing.isDeleted) {
    throw new AppError("ORGANIZATION_MEMBER_EXISTS");
  }

  // Upsert: re-activate if soft-deleted, or create new
  if (existing) {
    return prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId: Number(userId),
          organizationId: Number(organizationId),
        },
      },
      data: {
        role,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        joinDate: new Date(),
        updatedBy: addedBy,
        updatedAt: new Date(),
      },
      include: { user: { select: { userId: true, userName: true, email: true } } },
    });
  }

  return prisma.organizationMember.create({
    data: {
      userId: Number(userId),
      organizationId: Number(organizationId),
      role,
      joinDate: new Date(),
      createdBy: addedBy,
    },
    include: { user: { select: { userId: true, userName: true, email: true } } },
  });
};

// ─── Update member role ─────────────────────────────────────────────────────

const updateMemberRole = async (organizationId, userId, role, updatedBy, callerRoles) => {
  const hasPermission = await isAdminOrOrgLeader(callerRoles, Number(organizationId), updatedBy);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: Number(userId),
        organizationId: Number(organizationId),
      },
    },
  });

  if (!member || member.isDeleted) {
    throw new AppError("ORGANIZATION_NOT_MEMBER");
  }

  return prisma.organizationMember.update({
    where: {
      userId_organizationId: {
        userId: Number(userId),
        organizationId: Number(organizationId),
      },
    },
    data: { role, updatedBy, updatedAt: new Date() },
    include: { user: { select: { userId: true, userName: true, email: true } } },
  });
};

// ─── Remove member (soft delete) ────────────────────────────────────────────

const removeMember = async (organizationId, userId, removedBy, callerRoles) => {
  const hasPermission = await isAdminOrOrgLeader(callerRoles, Number(organizationId), removedBy);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: Number(userId),
        organizationId: Number(organizationId),
      },
    },
  });

  if (!member || member.isDeleted) {
    throw new AppError("ORGANIZATION_NOT_MEMBER");
  }

  return prisma.organizationMember.update({
    where: {
      userId_organizationId: {
        userId: Number(userId),
        organizationId: Number(organizationId),
      },
    },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy: removedBy },
  });
};

module.exports = {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  softDeleteOrganization,
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
};
