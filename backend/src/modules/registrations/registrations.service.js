const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const { ACTIVITY_STATUS, REGISTRATION_STATUS } = require("../../utils/constants");
const { isAdminOrOrgLeader } = require("../../utils/permissions");
const {
  getRegistrationQueue,
  getRegistrationQueueEvents,
} = require("../../config/bullmq");
const { resolveFields } = require("../../utils/s3-helpers");
const cache = require("../../utils/cache");

// ─── Create registration (queue-based) ──────────────────────────────────────
//
// Pre-validates activity state, then enqueues the job into BullMQ.
// The worker (concurrency=1) handles the capacity check + insert atomically,
// preventing race conditions where two concurrent requests both pass the
// count check and over-fill the activity.

const QUEUE_TIMEOUT_MS = 30_000;

const createRegistration = async (data, userId) => {
  const { activityId, registrationType, teamName, isLookingForTeam, teamMembers } = data;

  // ── Pre-validation (read-only, safe outside queue) ──
  const activity = await prisma.activity.findFirst({
    where: { activityId, isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  if (![ACTIVITY_STATUS.PUBLISHED, ACTIVITY_STATUS.RUNNING].includes(activity.activityStatus)) {
    throw new AppError("ACTIVITY_CANNOT_MODIFY", "Hoạt động chưa mở đăng ký");
  }

  if (activity.registrationDeadline && new Date() > activity.registrationDeadline) {
    throw new AppError("REGISTRATION_DEADLINE_PASSED");
  }

  // ── Enqueue registration job ──
  const queue = getRegistrationQueue();
  const queueEvents = getRegistrationQueueEvents();

  const job = await queue.add("register", {
    activityId,
    userId,
    registrationType,
    teamName,
    isLookingForTeam,
    teamMembers,
    maxParticipants: activity.maxParticipants,
    organizationId: activity.organizationId,
  });

  // Wait for the worker to finish processing this job
  const result = await job.waitUntilFinished(queueEvents, QUEUE_TIMEOUT_MS);

  // Worker returns { error, message } on validation failure, { data } on success
  if (result.error) {
    throw new AppError(result.error, result.message);
  }

  return result.data;
};

// ─── Cancel registration ────────────────────────────────────────────────────

const cancelRegistration = async (registrationId, userId) => {
  const registration = await prisma.registration.findFirst({
    where: { registrationId: Number(registrationId), userId, isDeleted: false },
    include: {
      activity: { select: { activityId: true, registrationDeadline: true, maxParticipants: true } },
    },
  });
  if (!registration) throw new AppError("REGISTRATION_NOT_FOUND");

  const cancellableStatuses = [
    REGISTRATION_STATUS.PENDING,
    REGISTRATION_STATUS.APPROVED,
    REGISTRATION_STATUS.WAITING,
  ];
  if (!cancellableStatuses.includes(registration.status)) {
    throw new AppError("REGISTRATION_CANNOT_CANCEL");
  }

  // Spec: ẩn nút hủy sau khi hết hạn đăng ký (enforce ở backend luôn)
  if (
    registration.activity.registrationDeadline &&
    new Date() > registration.activity.registrationDeadline
  ) {
    throw new AppError("REGISTRATION_DEADLINE_PASSED");
  }

  await prisma.registration.update({
    where: { registrationId: Number(registrationId) },
    data: { status: REGISTRATION_STATUS.CANCELLED, updatedBy: userId, updatedAt: new Date() },
  });

  // Invalidate activity detail cache so _count updates immediately
  try {
    await cache.del(`${cache.REDIS_PREFIX.ACTIVITY_DETAIL}${registration.activity.activityId}`);
  } catch (_) {}

  // Auto-promote người đầu tiên trong hàng chờ nếu hoạt động có giới hạn chỗ
  if (
    registration.activity.maxParticipants &&
    [REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.APPROVED].includes(registration.status)
  ) {
    await promoteWaitlist(registration.activity.activityId);
  }

  return { success: true };
};

// ─── Promote waitlist ────────────────────────────────────────────────────────
// Khi có chỗ trống, tự động chuyển người đầu tiên trong WAITING → PENDING

const promoteWaitlist = async (activityId) => {
  const next = await prisma.registration.findFirst({
    where: { activityId, status: REGISTRATION_STATUS.WAITING, isDeleted: false },
    orderBy: { registrationTime: "asc" },
  });

  if (!next) return null;

  const updated = await prisma.registration.update({
    where: { registrationId: next.registrationId },
    data: { status: REGISTRATION_STATUS.PENDING, updatedAt: new Date() },
    include: { activity: { select: { activityName: true } } },
  });

  // Thông báo cho người được promote
  try {
    const { sendNotification } = require("../notifications/notifications.service");
    await sendNotification(
      {
        title: "Có chỗ trống cho bạn!",
        content: `Đã có chỗ trống cho hoạt động "${updated.activity?.activityName}". Đăng ký của bạn đã được chuyển sang danh sách chờ duyệt.`,
        userId: next.userId,
        notificationType: "registration",
        channels: ["IN_APP"],
      },
      next.userId
    );
  } catch (_) {}

  return updated;
};

// ─── Get my registration for a specific activity ────────────────────────────

const getMyRegistrationByActivity = async (userId, activityId) => {
  const registration = await prisma.registration.findFirst({
    where: { userId, activityId: Number(activityId), isDeleted: false },
    include: {
      registrationCheckins: {
        include: { activityCheckin: true },
        orderBy: { checkInTime: "desc" },
      },
    },
  });
  return registration; // null nếu chưa đăng ký
};

// ─── Get my registrations ───────────────────────────────────────────────────

const getMyRegistrations = async (userId, { page = 1, limit = 20, status, attended } = {}) => {
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const where = {
    userId,
    isDeleted: false,
    ...(status && { status }),
    // attended=true: chỉ lấy những registration đã có check-in
    ...(attended === "true" && {
      registrationCheckins: { some: { checkInTime: { not: null } } },
    }),
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
            registrationDeadline: true,
            organization: { select: { organizationId: true, organizationName: true } },
          },
        },
        registrationCheckins: {
          select: { checkInTime: true, checkOutTime: true },
          orderBy: { checkInTime: "desc" },
        },
      },
      orderBy: { registrationTime: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.registration.count({ where }),
  ]);

  for (const item of data) {
    if (item.activity) await resolveFields(item.activity, ["coverImage"]);
  }

  return {
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get registrations by activity (admin/leader) ───────────────────────────

const getRegistrationsByActivity = async (activityId, { page = 1, limit = 20, status, search, checkinStatus, registrationType } = {}) => {
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const where = {
    activityId: Number(activityId),
    isDeleted: false,
    ...(status && { status }),
    ...(registrationType && { registrationType }),
    ...(search && {
      user: {
        OR: [
          { userName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { studentId: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
    ...(checkinStatus === "checkin" && {
      registrationCheckins: { some: { checkInTime: { not: null }, checkOutTime: null } },
    }),
    ...(checkinStatus === "checkout" && {
      registrationCheckins: { some: { checkOutTime: { not: null } } },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: {
        user: {
          select: {
            userId: true,
            userName: true,
            email: true,
            studentId: true,
            avatarUrl: true,
            phoneNumber: true,
            university: true,
            faculty: true,
            className: true,
          },
        },
        teamMembers: {
          where: { isDeleted: false },
          include: { user: { select: { userId: true, userName: true } } },
        },
        registrationCheckins: {
          orderBy: { checkInTime: "desc" },
          take: 1,
        },
      },
      orderBy: { registrationTime: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.registration.count({ where }),
  ]);

  for (const item of data) {
    if (item.user) await resolveFields(item.user, ["avatarUrl"]);
  }

  return {
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
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

  const updated = await prisma.registration.update({
    where: { registrationId: Number(registrationId) },
    data: { status, updatedBy: userId, updatedAt: new Date() },
    include: {
      user: { select: { userId: true, userName: true, email: true } },
    },
  });

  // Notify registrant on approval or rejection
  if ([REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.REJECTED].includes(status)) {
    const { sendNotification } = require("../notifications/notifications.service");
    const statusText = status === REGISTRATION_STATUS.APPROVED ? "được duyệt" : "bị từ chối";
    try {
      await sendNotification(
        {
          title: `Đăng ký ${statusText}`,
          content: `Đăng ký của bạn cho hoạt động "${registration.activity.activityName}" đã ${statusText}.`,
          userId: registration.userId,
          notificationType: "registration",
          channels: ["IN_APP"],
        },
        userId
      );
    } catch (_) {
      // Notification failure must not fail the status update
    }
  }

  return updated;
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

  const aid = Number(activityId);
  const [pending, approved, rejected, cancelled, waiting, checkedIn, checkedOut] = await Promise.all([
    prisma.registration.count({ where: { activityId: aid, isDeleted: false, status: REGISTRATION_STATUS.PENDING } }),
    prisma.registration.count({ where: { activityId: aid, isDeleted: false, status: REGISTRATION_STATUS.APPROVED } }),
    prisma.registration.count({ where: { activityId: aid, isDeleted: false, status: REGISTRATION_STATUS.REJECTED } }),
    prisma.registration.count({ where: { activityId: aid, isDeleted: false, status: REGISTRATION_STATUS.CANCELLED } }),
    prisma.registration.count({ where: { activityId: aid, isDeleted: false, status: REGISTRATION_STATUS.WAITING } }),
    prisma.registration.count({
      where: {
        activityId: aid,
        isDeleted: false,
        registrationCheckins: { some: { checkInTime: { not: null }, checkOutTime: null } },
      },
    }),
    prisma.registration.count({
      where: {
        activityId: aid,
        isDeleted: false,
        registrationCheckins: { some: { checkOutTime: { not: null } } },
      },
    }),
  ]);

  return {
    total: pending + approved + rejected + cancelled + waiting,
    pending,
    approved,
    rejected,
    cancelled,
    waiting,
    checkedIn,
    checkedOut,
    maxParticipants: activity.maxParticipants,
  };
};

// ─── Match team (org-side) ───────────────────────────────────────────────────

const matchTeam = async ({ activityId, teamName, leaderRegistrationId, memberRegistrationIds }, userId, roles) => {
  // Verify activity
  const activity = await prisma.activity.findFirst({
    where: { activityId: Number(activityId), isDeleted: false },
  });
  if (!activity) throw new AppError("ACTIVITY_NOT_FOUND");

  // Permission check
  const hasPermission = await isAdminOrOrgLeader(roles, activity.organizationId, userId);
  if (!hasPermission) throw new AppError("FORBIDDEN");

  // Verify leader registration
  const leaderReg = await prisma.registration.findFirst({
    where: { registrationId: Number(leaderRegistrationId), activityId: Number(activityId), isDeleted: false },
  });
  if (!leaderReg) throw new AppError("REGISTRATION_NOT_FOUND", "Không tìm thấy đăng ký của trưởng nhóm");

  // Verify member registrations
  const memberRegs = await prisma.registration.findMany({
    where: {
      registrationId: { in: memberRegistrationIds.map(Number) },
      activityId: Number(activityId),
      isDeleted: false,
    },
  });
  if (memberRegs.length !== memberRegistrationIds.length) {
    throw new AppError("REGISTRATION_NOT_FOUND", "Một số đăng ký không tồn tại");
  }

  // Update leader's registration to group type
  await prisma.registration.update({
    where: { registrationId: Number(leaderRegistrationId) },
    data: {
      registrationType: "group",
      teamName: teamName.trim(),
      updatedBy: userId,
      updatedAt: new Date(),
    },
  });

  // Create TeamMember entries
  const teamMemberData = [
    { registrationId: Number(leaderRegistrationId), userId: leaderReg.userId, role: "leader", createdBy: userId },
    ...memberRegs.map((r) => ({
      registrationId: Number(leaderRegistrationId),
      userId: r.userId,
      role: "member",
      createdBy: userId,
    })),
  ];
  await prisma.teamMember.createMany({ data: teamMemberData, skipDuplicates: true });

  // Soft-delete the member registrations (they are now part of the leader's team)
  await prisma.registration.updateMany({
    where: { registrationId: { in: memberRegistrationIds.map(Number) } },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
  });

  return { success: true, teamName: teamName.trim() };
};

module.exports = {
  createRegistration,
  cancelRegistration,
  getMyRegistrationByActivity,
  getMyRegistrations,
  getRegistrationsByActivity,
  getRegistrationById,
  updateRegistrationStatus,
  bulkUpdateStatus,
  checkin,
  checkout,
  getActivityParticipantStats,
  promoteWaitlist,
  matchTeam,
};
