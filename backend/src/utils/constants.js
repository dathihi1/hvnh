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

const ACTIVITY_TYPE = {
  PROGRAM: "program",
  COMPETITION: "competition",
  RECRUITMENT: "recruitment",
};

const TEAM_MODE = {
  INDIVIDUAL: "individual",
  TEAM: "team",
  BOTH: "both",
};

const REGISTRATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

const REGISTRATION_TYPE = {
  INDIVIDUAL: "individual",
  GROUP: "group",
};

const ORGANIZATION_TYPE = {
  UNIVERSITY: "university",
  CLUB: "club",
  DEPARTMENT: "department",
  COMPANY: "company",
};

const ORG_MEMBER_ROLE = {
  PRESIDENT: "president",
  VICE_PRESIDENT: "vice_president",
  HEAD_OF_DEPARTMENT: "head_of_department",
  VICE_HEAD: "vice_head",
  MEMBER: "member",
};

const APPLICATION_RESULT = {
  PENDING: "pending",
  INTERVIEW: "interview",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const TEAM_MEMBER_ROLE = {
  LEADER: "leader",
  MEMBER: "member",
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

// Valid activity status transitions
const VALID_STATUS_TRANSITIONS = {
  [ACTIVITY_STATUS.DRAFT]: [ACTIVITY_STATUS.PUBLISHED, ACTIVITY_STATUS.CANCELLED],
  [ACTIVITY_STATUS.PUBLISHED]: [ACTIVITY_STATUS.RUNNING, ACTIVITY_STATUS.CANCELLED],
  [ACTIVITY_STATUS.RUNNING]: [ACTIVITY_STATUS.FINISHED, ACTIVITY_STATUS.CANCELLED],
  [ACTIVITY_STATUS.FINISHED]: [],
  [ACTIVITY_STATUS.CANCELLED]: [],
};

module.exports = {
  USER_STATUS,
  ROLE_CODE,
  ACTIVITY_STATUS,
  ACTIVITY_TYPE,
  TEAM_MODE,
  REGISTRATION_STATUS,
  REGISTRATION_TYPE,
  ORGANIZATION_TYPE,
  ORG_MEMBER_ROLE,
  APPLICATION_RESULT,
  TEAM_MEMBER_ROLE,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  REDIS_PREFIX,
  RESET_PASSWORD_TTL,
  NOTIFICATION_QUEUE_NAME,
  VALID_STATUS_TRANSITIONS,
};
