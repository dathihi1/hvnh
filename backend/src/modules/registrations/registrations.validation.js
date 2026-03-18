const { z } = require("zod");

const createRegistrationSchema = z.object({
  activityId: z.coerce.number().int().positive(),
  registrationType: z.enum(["individual", "group"]).default("individual"),
  teamName: z.string().max(255).optional().nullable(),
  isLookingForTeam: z.boolean().optional().nullable(),
  teamMembers: z.array(z.object({
    userId: z.coerce.number().int().positive(),
    role: z.enum(["leader", "member"]).default("member"),
  })).optional(),
});

const getRegistrationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
});

const getMyRegistrationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
});

const updateRegistrationStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

const bulkUpdateStatusSchema = z.object({
  registrationIds: z.array(z.coerce.number().int().positive()).min(1),
  status: z.enum(["approved", "rejected"]),
});

const checkinSchema = z.object({
  activityCheckinId: z.coerce.number().int().positive(),
});

module.exports = {
  createRegistrationSchema,
  getRegistrationsQuerySchema,
  getMyRegistrationsQuerySchema,
  updateRegistrationStatusSchema,
  bulkUpdateStatusSchema,
  checkinSchema,
};
