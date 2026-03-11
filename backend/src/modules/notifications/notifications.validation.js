const { z } = require("zod");

const sendNotificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  userId: z.number().int().positive("User ID is required"),
  notificationType: z
    .enum(["system", "activity", "registration"])
    .optional()
    .default("system"),
  channels: z
    .array(z.enum(["IN_APP", "EMAIL", "SMS", "GMAIL", "GOOGLE_CALENDAR"]))
    .optional()
    .default(["IN_APP"]),
});

const sendBulkNotificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  notificationType: z
    .enum(["system", "activity", "registration"])
    .optional()
    .default("system"),
  channels: z
    .array(z.enum(["IN_APP", "EMAIL", "SMS", "GMAIL", "GOOGLE_CALENDAR"]))
    .optional()
    .default(["IN_APP"]),
  userIds: z.array(z.number().int().positive()).optional(),
  organizationId: z.number().int().positive().optional(),
  sendToAll: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().optional(),
});

const getNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  notificationType: z.enum(["system", "activity", "registration"]).optional(),
  status: z.enum(["unread", "read"]).optional(),
});

module.exports = {
  sendNotificationSchema,
  sendBulkNotificationSchema,
  getNotificationsSchema,
};
