const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");

const prisma = require("../../config/prisma");
const { redis } = require("../../config/redis");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeToken,
  hashToken,
} = require("../../utils/jwt");
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../../utils/mailer");
const {
  USER_STATUS,
  REDIS_PREFIX,
  RESET_PASSWORD_TTL,
} = require("../../utils/constants");
const AppError = require("../../utils/app-error");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getUserPrimaryRole = async (userId) => {
  const userRole = await prisma.userRole.findFirst({
    where: { userId, isDeleted: false },
    include: { role: true },
  });
  return userRole?.role?.code || "student";
};

const buildTokens = (userId, role) => {
  const payload = { id: userId, role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

const storeRefreshToken = async (userId, refreshToken) => {
  const decoded = decodeToken(refreshToken);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  await redis.setex(`${REDIS_PREFIX.REFRESH}${userId}`, ttl, refreshToken);
};

// ─── Service functions ────────────────────────────────────────────────────────

const register = async ({ userName, email, password, studentId, phoneNumber, university }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("AUTH_EMAIL_EXISTS");
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      userName,
      email,
      password: hashed,
      studentId: studentId || null,
      phoneNumber: phoneNumber || null,
      university,
      status: USER_STATUS.ACTIVE,
    },
    select: {
      userId: true,
      userName: true,
      email: true,
      university: true,
      status: true,
    },
  });

  const studentRole = await prisma.role.findUnique({ where: { code: "student" } });
  if (studentRole) {
    await prisma.userRole.create({
      data: { userId: user.userId, roleId: studentRole.roleId },
    });
  }

  sendWelcomeEmail({ to: email, name: userName }).catch(() => {});

  const { accessToken, refreshToken } = buildTokens(user.userId, "student");
  await storeRefreshToken(user.userId, refreshToken);

  return { user, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("AUTH_INVALID_CREDS");
  }

  if (user.status === USER_STATUS.BANNED || user.status === USER_STATUS.SUSPENDED) {
    throw new AppError("AUTH_ACCOUNT_LOCKED");
  }

  if (user.status === USER_STATUS.INACTIVE) {
    throw new AppError("AUTH_ACCOUNT_PENDING");
  }

  const role = await getUserPrimaryRole(user.userId);
  const { accessToken, refreshToken } = buildTokens(user.userId, role);
  await storeRefreshToken(user.userId, refreshToken);

  return {
    user: {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      university: user.university,
      status: user.status,
    },
    accessToken,
    refreshToken,
  };
};

const logout = async (token, userId) => {
  const decoded = decodeToken(token);
  const now = Math.floor(Date.now() / 1000);
  const remainingTtl = decoded.exp - now;

  if (remainingTtl > 0) {
    const tokenHash = hashToken(token);
    await redis.setex(
      `${REDIS_PREFIX.BLACKLIST}${tokenHash}`,
      remainingTtl,
      "1"
    );
  }

  await redis.del(`${REDIS_PREFIX.REFRESH}${userId}`);
};

const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError("AUTH_REFRESH_INVALID");
  }

  const stored = await redis.get(`${REDIS_PREFIX.REFRESH}${decoded.id}`);
  if (stored !== token) {
    throw new AppError("AUTH_REFRESH_INVALID");
  }

  const newAccessToken = signAccessToken({ id: decoded.id, role: decoded.role });
  return { accessToken: newAccessToken };
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.isDeleted) return;

  const resetToken = randomBytes(32).toString("hex");
  await redis.setex(
    `${REDIS_PREFIX.RESET_PASSWORD}${resetToken}`,
    RESET_PASSWORD_TTL,
    String(user.userId)
  );

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    name: user.userName,
    resetUrl,
  }).catch(() => {});
};

const resetPassword = async (token, newPassword) => {
  const redisKey = `${REDIS_PREFIX.RESET_PASSWORD}${token}`;
  const userId = await redis.get(redisKey);

  if (!userId) {
    throw new AppError("AUTH_RESET_INVALID");
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { userId: Number(userId) },
    data: { password: hashed },
  });

  await redis.del(redisKey);
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { userId },
  });

  if (!(await bcrypt.compare(oldPassword, user.password))) {
    throw new AppError("AUTH_WRONG_PASSWORD");
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { userId },
    data: { password: hashed },
  });
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
};
