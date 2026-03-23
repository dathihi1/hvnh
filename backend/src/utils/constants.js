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
  PENDING_REVIEW: "pending_review",
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
  WAITING: "waiting",
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
  USER_SESSION: "user:session:",
  GOOGLE_OAUTH_CODE: "google_code:",
  OTP: "otp:",
};

const RESET_PASSWORD_TTL = 15 * 60;
const GOOGLE_OAUTH_CODE_TTL = 5 * 60;
const OTP_TTL = 10 * 60;

const NOTIFICATION_QUEUE_NAME = "notification-queue";
const REGISTRATION_QUEUE_NAME = "registration-queue";

// Valid activity status transitions
const VALID_STATUS_TRANSITIONS = {
  [ACTIVITY_STATUS.DRAFT]: [ACTIVITY_STATUS.PENDING_REVIEW, ACTIVITY_STATUS.CANCELLED],
  [ACTIVITY_STATUS.PENDING_REVIEW]: [ACTIVITY_STATUS.PUBLISHED, ACTIVITY_STATUS.DRAFT, ACTIVITY_STATUS.CANCELLED],
  [ACTIVITY_STATUS.PUBLISHED]: [ACTIVITY_STATUS.RUNNING, ACTIVITY_STATUS.CANCELLED],
  [ACTIVITY_STATUS.RUNNING]: [ACTIVITY_STATUS.FINISHED, ACTIVITY_STATUS.CANCELLED],
  [ACTIVITY_STATUS.FINISHED]: [],
  [ACTIVITY_STATUS.CANCELLED]: [],
};

const FORM_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  CLOSED: "closed",
};

const RESPONSE_STATUS = {
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const QUESTION_TYPE = {
  SHORT_TEXT: "short_text",
  PARAGRAPH: "paragraph",
  MULTIPLE_CHOICE: "multiple_choice",
  CHECKBOXES: "checkboxes",
  DROPDOWN: "dropdown",
  FILE_UPLOAD: "file_upload",
  DATE: "date",
  TIME: "time",
  LINEAR_SCALE: "linear_scale",
  MULTIPLE_CHOICE_GRID: "multiple_choice_grid",
  CHECKBOX_GRID: "checkbox_grid",
};

const NAVIGATION_TYPE = {
  NEXT: "next",
  SECTION: "section",
  SUBMIT: "submit",
};

const CONFIG_KEYS = {
  ACTIVITY_REQUIRE_APPROVAL: "activity.require_approval",
  ACTIVITY_MAX_PER_ORG_MONTH: "activity.max_per_org_per_month",
  REGISTRATION_AUTO_APPROVE: "registration.auto_approve",
  REGISTRATION_ALLOW_CANCEL: "registration.allow_cancel_after_approve",
  ORG_REQUIRE_APPROVAL: "organization.require_approval_for_new",
  SYSTEM_MAINTENANCE: "system.maintenance_mode",
};

const CONFIG_DEFAULTS = {
  [CONFIG_KEYS.ACTIVITY_REQUIRE_APPROVAL]: { enabled: true },
  [CONFIG_KEYS.ACTIVITY_MAX_PER_ORG_MONTH]: { value: 0 },
  [CONFIG_KEYS.REGISTRATION_AUTO_APPROVE]: { enabled: false },
  [CONFIG_KEYS.REGISTRATION_ALLOW_CANCEL]: { enabled: true },
  [CONFIG_KEYS.ORG_REQUIRE_APPROVAL]: { enabled: false },
  [CONFIG_KEYS.SYSTEM_MAINTENANCE]: { enabled: false },
};

module.exports = {
  USER_STATUS,
  ROLE_CODE,
  GOOGLE_OAUTH_CODE_TTL,
  OTP_TTL,
  FORM_STATUS,
  RESPONSE_STATUS,
  QUESTION_TYPE,
  NAVIGATION_TYPE,
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
  REGISTRATION_QUEUE_NAME,
  VALID_STATUS_TRANSITIONS,
  CONFIG_KEYS,
  CONFIG_DEFAULTS,
};
