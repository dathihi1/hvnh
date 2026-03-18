const { z } = require("zod");

const updateProfileSchema = z.object({
  userName: z.string().min(2).max(255).optional(),
  phoneNumber: z.string().max(20).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  university: z.string().min(1).max(255).optional(),
  studentId: z.string().max(50).optional().nullable(),
});

const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "banned", "suspended"]).optional(),
  university: z.string().optional(),
});

const updateUserStatusSchema = z.object({
  status: z.enum(["active", "inactive", "banned", "suspended"]),
});

module.exports = {
  updateProfileSchema,
  getUsersQuerySchema,
  updateUserStatusSchema,
};
