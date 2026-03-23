const { z } = require("zod");

const createOrganizationSchema = z.object({
  organizationName: z.string().min(1, "Tên tổ chức là bắt buộc").max(255),
  organizationType: z.enum(["university", "club", "department", "company"]),
  email: z.string().email("Email không hợp lệ").optional().nullable(),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").optional().nullable(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
});

const updateOrganizationSchema = z.object({
  organizationName: z.string().min(1).max(255).optional(),
  email: z.string().email("Email không hợp lệ").optional().nullable(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  leftImageUrl: z.string().optional().nullable(),
  rightImageUrl: z.string().optional().nullable(),
  middleImageUrl: z.string().optional().nullable(),
  tiktokUrl: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
});

const getOrganizationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  organizationType: z.enum(["university", "club", "department", "company"]).optional(),
});

const addMemberSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: z.enum(["president", "vice_president", "head_of_department", "vice_head", "member"]).default("member"),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(["president", "vice_president", "head_of_department", "vice_head", "member"]),
});

module.exports = {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationsQuerySchema,
  addMemberSchema,
  updateMemberRoleSchema,
};
