const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
  SUSPENDED: "suspended",
};

const ROLE_CODE = {
  ADMIN: "admin",
  STUDENT: "student",
  ORGANIZATION_LEADER: "organization_leader",
  ORGANIZATION_MEMBER: "organization_member",
};

const ACTIVITY_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  RUNNING: "running",
  FINISHED: "finished",
  CANCELLED: "cancelled",
};

const REGISTRATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

const NOTIFICATION_STATUS = {
  UNREAD: "unread",
  READ: "read",
};

const NOTIFICATION_TYPE = {
  ACTIVITY: "activity",
  REGISTRATION: "registration",
  SYSTEM: "system",
};

const REDIS_PREFIX = {
  BLACKLIST: "blacklist:",
  REFRESH: "refresh:",
  RESET_PASSWORD: "reset_pwd:",
};

const RESET_PASSWORD_TTL = 15 * 60;

const NOTIFICATION_QUEUE_NAME = "notification-queue";

module.exports = {
  USER_STATUS,
  ROLE_CODE,
  ACTIVITY_STATUS,
  REGISTRATION_STATUS,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  REDIS_PREFIX,
  RESET_PASSWORD_TTL,
  NOTIFICATION_QUEUE_NAME,
};
