const { verifyAccessToken, hashToken } = require("../utils/jwt");
const { redis } = require("../config/redis");
const prisma = require("../config/prisma");
const { REDIS_PREFIX, USER_STATUS } = require("../utils/constants");
const AppError = require("../utils/app-error");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("AUTH_TOKEN_MISSING");
    }

    const token = authHeader.split(" ")[1];

    // Check Redis blacklist
    const tokenHash = hashToken(token);
    const isBlacklisted = await redis.get(
      `${REDIS_PREFIX.BLACKLIST}${tokenHash}`
    );

    if (isBlacklisted) {
      throw new AppError("AUTH_TOKEN_BLACKLISTED");
    }

    // Verify signature + expiry
    const decoded = verifyAccessToken(token);

    // Check user
    const user = await prisma.user.findFirst({
      where: { userId: decoded.id, isDeleted: false },
      select: {
        userId: true,
        userName: true,
        email: true,
        university: true,
        status: true,
        userRoles: {
          where: { isDeleted: false },
          select: { role: { select: { code: true } } },
        },
      },
    });

    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    if (user.status === USER_STATUS.BANNED || user.status === USER_STATUS.SUSPENDED) {
      throw new AppError("AUTH_ACCOUNT_LOCKED");
    }

    if (user.status === USER_STATUS.INACTIVE) {
      throw new AppError("AUTH_ACCOUNT_PENDING");
    }

    req.user = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      university: user.university,
      status: user.status,
      roles: user.userRoles.map((ur) => ur.role.code),
    };
    req.token = token;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    if (err.name === "TokenExpiredError") {
      return next(new AppError("AUTH_TOKEN_EXPIRED"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("AUTH_TOKEN_INVALID"));
    }
    next(err);
  }
};

module.exports = { protect };
