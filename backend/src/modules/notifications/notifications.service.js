const prisma = require("../../config/prisma");
const { getNotificationQueue } = require("../../config/bullmq");
const AppError = require("../../utils/app-error");
const {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  USER_STATUS,
} = require("../../utils/constants");

// ─── Send single notification ────────────────────────────────────────────────

const sendNotification = async (
  { title, content, userId, notificationType, channels },
  createdBy
) => {
  const notification = await prisma.notification.create({
    data: {
      title,
      content,
      notificationType: notificationType || NOTIFICATION_TYPE.SYSTEM,
      status: NOTIFICATION_STATUS.UNREAD,
      userId,
      createdBy,
    },
  });

  const externalChannels = (channels || []).filter((k) => k !== "IN_APP");
  if (externalChannels.length > 0) {
    const queue = getNotificationQueue();
    await queue.add("send-notification", {
      notificationId: notification.notificationId,
      userId,
      title,
      content,
      channels: externalChannels,
    });
  }

  return notification;
};

// ─── Send bulk notification ──────────────────────────────────────────────────

const sendBulkNotification = async (payload, createdBy) => {
  const {
    title,
    content,
    notificationType,
    channels,
    userIds: specificUserIds,
    organizationId,
    sendToAll,
    scheduledAt,
  } = payload;

  let userIds = [];

  if (specificUserIds && specificUserIds.length > 0) {
    userIds = specificUserIds;
  } else if (organizationId) {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId, isDeleted: false },
      select: { userId: true },
    });
    userIds = members.map((m) => m.userId);
  } else if (sendToAll) {
    const users = await prisma.user.findMany({
      where: { isDeleted: false, status: USER_STATUS.ACTIVE },
      select: { userId: true },
    });
    userIds = users.map((u) => u.userId);
  }

  if (userIds.length === 0) {
    throw new AppError("NOTIFICATION_NO_RECIPIENTS");
  }

  const notificationData = userIds.map((uid) => ({
    title,
    content,
    notificationType: notificationType || NOTIFICATION_TYPE.SYSTEM,
    status: NOTIFICATION_STATUS.UNREAD,
    userId: uid,
    createdBy,
  }));

  await prisma.notification.createMany({ data: notificationData });

  const externalChannels = (channels || []).filter((k) => k !== "IN_APP");
  if (externalChannels.length > 0) {
    const queue = getNotificationQueue();
    const delay = scheduledAt
      ? Math.max(0, new Date(scheduledAt).getTime() - Date.now())
      : 0;

    const jobs = userIds.map((uid) => ({
      name: "send-notification",
      data: {
        userId: uid,
        title,
        content,
        channels: externalChannels,
        startTime: payload.startTime,
        endTime: payload.endTime,
        location: payload.location,
      },
      opts: delay > 0 ? { delay } : {},
    }));

    await queue.addBulk(jobs);
  }

  return { totalSent: userIds.length };
};

// ─── Get my notifications (paginated) ────────────────────────────────────────

const getMyNotifications = async (
  userId,
  { page = 1, limit = 20, notificationType, status }
) => {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;

  const where = {
    userId,
    isDeleted: false,
    ...(notificationType && { notificationType }),
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { notificationTime: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// ─── Get single notification ─────────────────────────────────────────────────

const getNotificationById = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: { notificationId: Number(notificationId), userId, isDeleted: false },
  });

  if (!notification) {
    throw new AppError("NOTIFICATION_NOT_FOUND");
  }

  return notification;
};

// ─── Mark as read ────────────────────────────────────────────────────────────

const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: { notificationId: Number(notificationId), userId, isDeleted: false },
  });

  if (!notification) {
    throw new AppError("NOTIFICATION_NOT_FOUND");
  }

  return prisma.notification.update({
    where: { notificationId: Number(notificationId) },
    data: { status: NOTIFICATION_STATUS.READ },
  });
};

// ─── Mark all as read ────────────────────────────────────────────────────────

const markAllAsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      status: NOTIFICATION_STATUS.UNREAD,
      isDeleted: false,
    },
    data: { status: NOTIFICATION_STATUS.READ },
  });

  return { updated: result.count };
};

// ─── Soft delete ─────────────────────────────────────────────────────────────

const deleteNotification = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: { notificationId: Number(notificationId), userId, isDeleted: false },
  });

  if (!notification) {
    throw new AppError("NOTIFICATION_NOT_FOUND");
  }

  return prisma.notification.update({
    where: { notificationId: Number(notificationId) },
    data: { isDeleted: true, deletedBy: userId },
  });
};

// ─── Unread count ────────────────────────────────────────────────────────────

const getUnreadCount = async (userId) => {
  const count = await prisma.notification.count({
    where: {
      userId,
      status: NOTIFICATION_STATUS.UNREAD,
      isDeleted: false,
    },
  });

  return { unreadCount: count };
};

module.exports = {
  sendNotification,
  sendBulkNotification,
  getMyNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};
