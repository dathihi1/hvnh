const { z } = require("zod");

const createApplicationSchema = z.object({
  activityId: z.coerce.number().int().positive(),
  note: z.string().optional().nullable(),
});

const updateApplicationSchema = z.object({
  result: z.enum(["interview", "accepted", "rejected"]),
  interviewTime: z.coerce.date().optional().nullable(),
  note: z.string().optional().nullable(),
});

const getApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  activityId: z.coerce.number().int().positive().optional(),
  result: z.enum(["pending", "interview", "accepted", "rejected"]).optional(),
});

module.exports = {
  createApplicationSchema,
  updateApplicationSchema,
  getApplicationsQuerySchema,
};
