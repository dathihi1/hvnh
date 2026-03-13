const { z } = require("zod");

const roleEnum = z.enum(["student", "organization_leader", "organization_member", "admin"]);

const createUserSchema = z.object({
  userName: z.string().min(2, "Name must be at least 2 characters").max(255),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  university: z.string().min(1, "University is required").max(255),
  studentId: z.string().max(50).optional(),
  phoneNumber: z.string().max(20).optional(),
  role: roleEnum.default("student"),
});

module.exports = { createUserSchema };
