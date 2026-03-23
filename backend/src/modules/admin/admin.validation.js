const { z } = require("zod");

const roleEnum = z.enum(["student", "organization_leader", "organization_member", "club", "admin"]);

const createUserSchema = z.object({
  userName: z.string().min(2, "Name must be at least 2 characters").max(255),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  university: z.string().min(1, "University is required").max(255),
  faculty: z.string().max(255).optional(),
  className: z.string().max(100).optional(),
  studentId: z.string().max(50).optional(),
  phoneNumber: z.string().max(20).optional(),
  role: roleEnum.default("student"),
});

const orgTypeEnum = z.enum(["university", "club", "department", "company"]);

const createOrganizationSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").max(255),
  organizationType: orgTypeEnum,
  email: z.string().email("Invalid email").optional(),
  description: z.string().optional(),
  // Leader account fields (auto-created)
  leaderName: z.string().min(2, "Leader name is required").max(255),
  leaderEmail: z.string().email("Invalid leader email"),
  leaderPassword: z.string().min(8, "Password must be at least 8 characters"),
  leaderUniversity: z.string().min(1, "University is required").max(255),
  leaderPhoneNumber: z.string().max(20).optional(),
});

module.exports = { createUserSchema, createOrganizationSchema };
