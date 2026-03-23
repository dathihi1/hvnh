const bcrypt = require("bcryptjs");
const { randomBytes, randomUUID } = require("crypto");

const prisma = require("../../config/prisma");
const { redis } = require("../../config/redis");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeToken,
  hashToken,
} = require("../../utils/jwt");
const { sendPasswordResetEmail, sendWelcomeEmail, sendOtpEmail } = require("../../utils/mailer");
const {
  USER_STATUS,
  REDIS_PREFIX,
  RESET_PASSWORD_TTL,
  GOOGLE_OAUTH_CODE_TTL,
  OTP_TTL,
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

// Store SHA-256 hash of refresh token (not the raw token)
const storeRefreshToken = async (userId, refreshToken) => {
  const decoded = decodeToken(refreshToken);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  await redis.setex(`${REDIS_PREFIX.REFRESH}${userId}`, ttl, hashToken(refreshToken));
};

const invalidateUserSession = async (userId) => {
  await redis.del(`${REDIS_PREFIX.USER_SESSION}${userId}`);
};

// ─── Service functions ────────────────────────────────────────────────────────

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const register = async ({ userName, email, password, studentId, phoneNumber, university, faculty, className }) => {
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
      faculty: faculty || null,
      className: className || null,
      status: USER_STATUS.INACTIVE,
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

  const otp = generateOtp();
  await redis.setex(`${REDIS_PREFIX.OTP}${user.userId}`, OTP_TTL, otp);

  sendOtpEmail({ to: email, name: userName, otp }).catch(() => {});

  return { userId: user.userId, email };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
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
      role,
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

  await Promise.all([
    redis.del(`${REDIS_PREFIX.REFRESH}${userId}`),
    invalidateUserSession(userId),
  ]);
};

const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError("AUTH_REFRESH_INVALID");
  }

  const storedHash = await redis.get(`${REDIS_PREFIX.REFRESH}${decoded.id}`);
  // Compare stored hash with hash of presented token
  if (!storedHash || storedHash !== hashToken(token)) {
    throw new AppError("AUTH_REFRESH_INVALID");
  }

  // Rotate: issue new access + refresh tokens
  const newAccessToken = signAccessToken({ id: decoded.id, role: decoded.role });
  const newRefreshToken = signRefreshToken({ id: decoded.id, role: decoded.role });
  await storeRefreshToken(decoded.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.isDeleted) return;

  const resetToken = randomBytes(32).toString("hex");
  // Store hash of the reset token as the Redis key (not raw token)
  const resetTokenHash = hashToken(resetToken);
  await redis.setex(
    `${REDIS_PREFIX.RESET_PASSWORD}${resetTokenHash}`,
    RESET_PASSWORD_TTL,
    String(user.userId)
  );

  const resetUrl = `${process.env.FRONTEND_URL}/auth/new-password?token=${resetToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    name: user.userName,
    resetUrl,
  }).catch(() => {});
};

const resetPassword = async (token, newPassword) => {
  // Look up by hash of the token
  const redisKey = `${REDIS_PREFIX.RESET_PASSWORD}${hashToken(token)}`;
  const userId = await redis.get(redisKey);

  if (!userId) {
    throw new AppError("AUTH_RESET_INVALID");
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { userId: Number(userId) },
    data: { password: hashed },
  });

  await Promise.all([
    redis.del(redisKey),
    invalidateUserSession(Number(userId)),
  ]);
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

  await invalidateUserSession(userId);
};

const verifyOtp = async (userId, otp) => {
  const key = `${REDIS_PREFIX.OTP}${userId}`;
  const stored = await redis.get(key);

  if (!stored || stored !== otp) {
    throw new AppError("AUTH_OTP_INVALID");
  }

  await redis.del(key);

  const user = await prisma.user.update({
    where: { userId: Number(userId) },
    data: { status: USER_STATUS.ACTIVE },
    select: {
      userId: true,
      userName: true,
      email: true,
      university: true,
      status: true,
    },
  });

  sendWelcomeEmail({ to: user.email, name: user.userName }).catch(() => {});

  const role = await getUserPrimaryRole(user.userId);
  const { accessToken, refreshToken } = buildTokens(user.userId, role);
  await storeRefreshToken(user.userId, refreshToken);

  return { user: { ...user, role }, accessToken, refreshToken };
};

const resendOtp = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.isDeleted) return;

  if (user.status !== USER_STATUS.INACTIVE) {
    throw new AppError("AUTH_OTP_ALREADY_VERIFIED");
  }

  const otp = generateOtp();
  await redis.setex(`${REDIS_PREFIX.OTP}${user.userId}`, OTP_TTL, otp);

  sendOtpEmail({ to: email, name: user.userName, otp }).catch(() => {});
};

const loginWithGoogle = async (user) => {
  if (user.status === USER_STATUS.BANNED || user.status === USER_STATUS.SUSPENDED) {
    throw new AppError("AUTH_ACCOUNT_LOCKED");
  }

  if (user.status === USER_STATUS.INACTIVE) {
    throw new AppError("AUTH_ACCOUNT_PENDING");
  }

  const role = await getUserPrimaryRole(user.userId);
  const { accessToken, refreshToken } = buildTokens(user.userId, role);
  await storeRefreshToken(user.userId, refreshToken);

  const code = randomUUID();
  await redis.setex(
    `${REDIS_PREFIX.GOOGLE_OAUTH_CODE}${code}`,
    GOOGLE_OAUTH_CODE_TTL,
    JSON.stringify({
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        university: user.university,
        status: user.status,
        role,
      },
    })
  );

  return code;
};

const exchangeGoogleCode = async (code) => {
  const key = `${REDIS_PREFIX.GOOGLE_OAUTH_CODE}${code}`;
  const data = await redis.get(key);

  if (!data) throw new AppError("AUTH_GOOGLE_CODE_INVALID");

  await redis.del(key);

  return JSON.parse(data);
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyOtp,
  resendOtp,
  loginWithGoogle,
  exchangeGoogleCode,
};
