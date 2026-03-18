const { z } = require("zod");

const createActivitySchema = z.object({
  activityName: z.string().min(1, "Tên hoạt động là bắt buộc").max(255),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  activityType: z.enum(["program", "competition", "recruitment"]),
  teamMode: z.enum(["individual", "team", "both"]).default("individual"),
  startTime: z.coerce.date().optional().nullable(),
  endTime: z.coerce.date().optional().nullable(),
  registrationDeadline: z.coerce.date().optional().nullable(),
  minParticipants: z.coerce.number().int().min(1).optional().nullable(),
  maxParticipants: z.coerce.number().int().min(1).optional().nullable(),
  prize: z.string().optional().nullable(),
  organizationId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  teamRule: z.object({
    minTeamMembers: z.coerce.number().int().min(1).optional().nullable(),
    maxTeamMembers: z.coerce.number().int().min(1).optional().nullable(),
  }).optional().nullable(),
});

const updateActivitySchema = z.object({
  activityName: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  activityType: z.enum(["program", "competition", "recruitment"]).optional(),
  teamMode: z.enum(["individual", "team", "both"]).optional(),
  startTime: z.coerce.date().optional().nullable(),
  endTime: z.coerce.date().optional().nullable(),
  registrationDeadline: z.coerce.date().optional().nullable(),
  minParticipants: z.coerce.number().int().min(1).optional().nullable(),
  maxParticipants: z.coerce.number().int().min(1).optional().nullable(),
  prize: z.string().optional().nullable(),
  categoryId: z.coerce.number().int().positive().optional(),
  teamRule: z.object({
    minTeamMembers: z.coerce.number().int().min(1).optional().nullable(),
    maxTeamMembers: z.coerce.number().int().min(1).optional().nullable(),
  }).optional().nullable(),
});

const updateActivityStatusSchema = z.object({
  activityStatus: z.enum(["draft", "published", "running", "finished", "cancelled"]),
});

const getActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  organizationId: z.coerce.number().int().positive().optional(),
  activityStatus: z.enum(["draft", "published", "running", "finished", "cancelled"]).optional(),
  activityType: z.enum(["program", "competition", "recruitment"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(["startTime", "createdAt", "activityName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createCategorySchema = z.object({
  categoryName: z.string().min(1, "Tên danh mục là bắt buộc").max(255),
});

const createCheckinSessionSchema = z.object({
  checkInTime: z.coerce.date(),
  checkOutTime: z.coerce.date().optional().nullable(),
});

module.exports = {
  createActivitySchema,
  updateActivitySchema,
  updateActivityStatusSchema,
  getActivitiesQuerySchema,
  createCategorySchema,
  createCheckinSessionSchema,
};
