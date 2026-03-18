const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const { ACTIVITY_STATUS, REGISTRATION_STATUS } = require("../../utils/constants");
const { isAdminOrOrgLeader } = require("../../utils/permissions");

// ─── Create registration ────────────────────────────────────────────────────

const createRegistration = async (data, userId) => {
  const { activityId, registrationType, teamName, isLookingForTeam, teamMembers } = data;

  // Verify activity
  const activity = await prisma.activity.findFirst({
    where: { activityId, isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  // Must be published or running
  if (![ACTIVITY_STATUS.PUBLISHED, ACTIVITY_STATUS.RUNNING].includes(activity.activityStatus)) {
    throw new AppError("ACTIVITY_CANNOT_MODIFY", "Hoạt động chưa mở đăng ký");
  }

  // Check deadline
  if (activity.registrationDeadline && new Date() > activity.registrationDeadline) {
    throw new AppError("REGISTRATION_DEADLINE_PASSED");
  }

  // Check duplicate
  const existing = await prisma.registration.findUnique({
    where: { userId_activityId: { userId, activityId } },
  });
  if (existing && !existing.isDeleted) {
    throw new AppError("REGISTRATION_DUPLICATE");
  }

  // Check capacity
  let isWaitlisted = false;
  if (activity.maxParticipants) {
    const currentCount = await prisma.registration.count({
      where: {
        activityId,
        isDeleted: false,
        status: { in: [REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.APPROVED] },
      },
    });
    if (currentCount >= activity.maxParticipants) {
      isWaitlisted = true;
    }
  }

  // Re-activate if soft-deleted, or create new
  let registration;
  if (existing && existing.isDeleted) {
    registration = await prisma.registration.update({
      where: { registrationId: existing.registrationId },
      data: {
        status: REGISTRATION_STATUS.PENDING,
        registrationType,
        teamName: teamName || null,
        isLookingForTeam: isLookingForTeam || null,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        registrationTime: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
  } else {
    registration = await prisma.registration.create({
      data: {
        userId,
        activityId,
        status: REGISTRATION_STATUS.PENDING,
        registrationType,
        teamName: teamName || null,
        isLookingForTeam: isLookingForTeam || null,
        createdBy: userId,
      },
    });
  }

  // Create team members if group registration
  if (registrationType === "group" && teamMembers && teamMembers.length > 0) {
    const memberData = teamMembers.map((m) => ({
      registrationId: registration.registrationId,
      userId: m.userId,
      role: m.role || "member",
      createdBy: userId,
    }));

    // Add the creator as leader
    memberData.unshift({
      registrationId: registration.registrationId,
      userId,
      role: "leader",
      createdBy: userId,
    });

    // Use createMany, skip duplicates
    await prisma.teamMember.createMany({
      data: memberData,
      skipDuplicates: true,
    });
  }

  const result = await prisma.registration.findUnique({
    where: { registrationId: registration.registrationId },
    include: {
      activity: { select: { activityId: true, activityName: true } },
      teamMembers: {
        where: { isDeleted: false },
        include: { user: { select: { userId: true, userName: true } } },
      },
    },
  });

  return { ...result, isWaitlisted };
};

// ─── Cancel registration ────────────────────────────────────────────────────

const cancelRegistration = async (registrationId, userId) => {
  const registration = await prisma.registration.findFirst({
    where: { registrationId: Number(registrationId), userId, isDeleted: false },
  });
  if (!registration) throw new AppError("REGISTRATION_NOT_FOUND");

  if (![REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.APPROVED].includes(registration.status)) {
    throw new AppError("REGISTRATION_CANNOT_CANCEL");
  }

  return prisma.registration.update({
    where: { registrationId: Number(registrationId) },
    data: { status: REGISTRATION_STATUS.CANCELLED, updatedBy: userId, updatedAt: new Date() },
  });
};

// ─── Get my registrations ───────────────────────────────────────────────────

const getMyRegistrations = async (userId, { page = 1, limit = 20, status }) => {
  const where = {
    userId,
    isDeleted: false,
    ...(status && { status }),
  };

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
            coverImage: true,
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

// ─── Get registrations by activity (admin/leader) ───────────────────────────

const getRegistrationsByActivity = async (activityId, { page = 1, limit = 20, status }) => {
  const where = {
    activityId: Number(activityId),
    isDeleted: false,
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: {
        user: { select: { userId: true, userName: true, email: true, studentId: true, avatarUrl: true } },
        teamMembers: {
          where: { isDeleted: false },
          include: { user: { select: { userId: true, userName: true } } },
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

// ─── Get registration by ID ────────────────────────────────────────────────

const getRegistrationById = async (registrationId) => {
  const registration = await prisma.registration.findFirst({
    where: { registrationId: Number(registrationId), isDeleted: false },
    include: {
      activity: {
        select: {
          activityId: true,
          activityName: true,
          activityStatus: true,
          startTime: true,
          organization: { select: { organizationId: true, organizationName: true } },
        },
      },
      user: { select: { userId: true, userName: true, email: true, studentId: true } },
      teamMembers: {
        where: { isDeleted: false },
        include: { user: { select: { userId: true, userName: true } } },
      },
      registrationCheckins: {
        include: { activityCheckin: true },
        orderBy: { checkInTime: "desc" },
      },
    },
  });

  if (!registration) throw new AppError("REGISTRATION_NOT_FOUND");
  return registration;
};

// ─── Update registration status (approve/reject) ───────────────────────────

const updateRegistrationStatus = async (registrationId, status, userId, roles) => {
  const registration = await prisma.registration.findFirst({
    where: { registrationId: Number(registrationId), isDeleted: false },
    include: { activity: true },
  });
  if (!registration) throw new AppError("REGISTRATION_NOT_FOUND");

  const hasPermission = await isAdminOrOrgLeader(
    roles, registration.activity.organizationId, userId
  );
  if (!hasPermission) throw new AppError("FORBIDDEN");

  return prisma.registration.update({
    where: { registrationId: Number(registrationId) },
    data: { status, updatedBy: userId, updatedAt: new Date() },
    include: {
      user: { select: { userId: true, userName: true, email: true } },
    },
  });
};

// ─── Bulk update status ─────────────────────────────────────────────────────

const bulkUpdateStatus = async (registrationIds, status, userId) => {
  const result = await prisma.registration.updateMany({
    where: {
      registrationId: { in: registrationIds.map(Number) },
      isDeleted: false,
    },
    data: { status, updatedBy: userId, updatedAt: new Date() },
  });

  return { updated: result.count };
};

// ─── Check in ───────────────────────────────────────────────────────────────

const checkin = async (registrationId, activityCheckinId, userId) => {
  const registration = await prisma.registration.findFirst({
    where: { registrationId: Number(registrationId), isDeleted: false },
  });
  if (!registration) throw new AppError("REGISTRATION_NOT_FOUND");

  if (registration.status !== REGISTRATION_STATUS.APPROVED) {
    throw new AppError("REGISTRATION_NOT_APPROVED");
  }

  // Verify checkin session exists
  const session = await prisma.activityCheckin.findUnique({
    where: { checkinId: Number(activityCheckinId) },
  });
  if (!session) throw new AppError("CHECKIN_SESSION_NOT_FOUND");

  // Check duplicate
  const existing = await prisma.registrationCheckin.findUnique({
    where: {
      registrationId_activityCheckinId: {
        registrationId: Number(registrationId),
        activityCheckinId: Number(activityCheckinId),
      },
    },
  });
  if (existing) throw new AppError("CHECKIN_ALREADY_EXISTS");

  return prisma.registrationCheckin.create({
    data: {
      registrationId: Number(registrationId),
      activityCheckinId: Number(activityCheckinId),
      checkInTime: new Date(),
    },
  });
};

// ─── Check out ──────────────────────────────────────────────────────────────

const checkout = async (registrationId, activityCheckinId) => {
  const existing = await prisma.registrationCheckin.findUnique({
    where: {
      registrationId_activityCheckinId: {
        registrationId: Number(registrationId),
        activityCheckinId: Number(activityCheckinId),
      },
    },
  });
  if (!existing) throw new AppError("CHECKIN_SESSION_NOT_FOUND");

  return prisma.registrationCheckin.update({
    where: { checkinId: existing.checkinId },
    data: { checkOutTime: new Date() },
  });
};

// ─── Activity participant stats ─────────────────────────────────────────────

const getActivityParticipantStats = async (activityId) => {
  const activity = await prisma.activity.findFirst({
    where: { activityId: Number(activityId), isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  const [pending, approved, rejected, cancelled, checkedIn] = await Promise.all([
    prisma.registration.count({ where: { activityId: Number(activityId), isDeleted: false, status: REGISTRATION_STATUS.PENDING } }),
    prisma.registration.count({ where: { activityId: Number(activityId), isDeleted: false, status: REGISTRATION_STATUS.APPROVED } }),
    prisma.registration.count({ where: { activityId: Number(activityId), isDeleted: false, status: REGISTRATION_STATUS.REJECTED } }),
    prisma.registration.count({ where: { activityId: Number(activityId), isDeleted: false, status: REGISTRATION_STATUS.CANCELLED } }),
    prisma.registrationCheckin.count({
      where: {
        registration: { activityId: Number(activityId), isDeleted: false },
        checkInTime: { not: null },
      },
    }),
  ]);

  return {
    total: pending + approved + rejected + cancelled,
    pending,
    approved,
    rejected,
    cancelled,
    checkedIn,
    maxParticipants: activity.maxParticipants,
  };
};

module.exports = {
  createRegistration,
  cancelRegistration,
  getMyRegistrations,
  getRegistrationsByActivity,
  getRegistrationById,
  updateRegistrationStatus,
  bulkUpdateStatus,
  checkin,
  checkout,
  getActivityParticipantStats,
};
