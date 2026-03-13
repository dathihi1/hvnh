const { z } = require("zod");

const registerSchema = z.object({
  userName: z.string().min(2, "Name must be at least 2 characters").max(255),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  university: z.string().min(1, "University is required").max(255),
  studentId: z.string().max(50).optional(),
  phoneNumber: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Invalid token"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
