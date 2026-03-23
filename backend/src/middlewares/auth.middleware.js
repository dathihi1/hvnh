const { verifyAccessToken, hashToken } = require("../utils/jwt");
const { redis } = require("../config/redis");
const prisma = require("../config/prisma");
const { REDIS_PREFIX, USER_STATUS } = require("../utils/constants");
const AppError = require("../utils/app-error");

const USER_SESSION_TTL = 60; // seconds — cache user profile for 60s per request

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("AUTH_TOKEN_MISSING");
    }

    const token = authHeader.split(" ")[1];

    // ── Check blacklist ────────────────────────────────────────────────────────
    const tokenHash = hashToken(token);
    const isBlacklisted = await redis.get(`${REDIS_PREFIX.BLACKLIST}${tokenHash}`);
    if (isBlacklisted) {
      throw new AppError("AUTH_TOKEN_BLACKLISTED");
    }

    // ── Verify JWT ─────────────────────────────────────────────────────────────
    const decoded = verifyAccessToken(token);

    // ── User session cache (avoids DB query on every request) ─────────────────
    const cacheKey = `${REDIS_PREFIX.USER_SESSION}${decoded.id}`;
    let user = null;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        user = JSON.parse(cached);
      }
    } catch {
      // cache miss — fall through to DB
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: { userId: decoded.id, isDeleted: false },
        select: {
          userId: true,
          userName: true,
          email: true,
          university: true,
          status: true,
          userRoles: {
            where: { isDeleted: false },
            select: {
              role: { select: { code: true } },
            },
          },
        },
      });

      if (user) {
        // Cache for 60s — invalidated on logout / changePassword / admin role change
        await redis.setex(cacheKey, USER_SESSION_TTL, JSON.stringify(user)).catch(() => {});
      }
    }

    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    // ── Status check ───────────────────────────────────────────────────────────
    if (user.status === USER_STATUS.BANNED || user.status === USER_STATUS.SUSPENDED) {
      throw new AppError("AUTH_ACCOUNT_LOCKED");
    }

    if (user.status === USER_STATUS.INACTIVE) {
      throw new AppError("AUTH_ACCOUNT_PENDING");
    }

    // ── Attach user to request ─────────────────────────────────────────────────
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
    if (err instanceof AppError) return next(err);
    if (err.name === "TokenExpiredError") return next(new AppError("AUTH_TOKEN_EXPIRED"));
    if (err.name === "JsonWebTokenError") return next(new AppError("AUTH_TOKEN_INVALID"));
    next(err);
  }
};

module.exports = { protect };
