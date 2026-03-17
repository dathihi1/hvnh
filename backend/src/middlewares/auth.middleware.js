const { verifyAccessToken, hashToken } = require("../utils/jwt");
// hàm verify JWT và hàm hash token

const { redis } = require("../config/redis");
// kết nối Redis để kiểm tra blacklist token

const prisma = require("../config/prisma");
// Prisma ORM để truy vấn database

const { REDIS_PREFIX, USER_STATUS } = require("../utils/constants");
// các hằng số dùng chung (prefix redis, trạng thái user)

const AppError = require("../utils/app-error");
// class lỗi custom của project

const protect = async (req, res, next) => {
  try {
    // Lấy header Authorization từ request
    const authHeader = req.headers.authorization;

    // Kiểm tra xem header có tồn tại và đúng định dạng "Bearer TOKEN" không
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("AUTH_TOKEN_MISSING");
      // nếu không có token thì báo lỗi
    }

    // Tách token ra khỏi chuỗi "Bearer TOKEN"
    const token = authHeader.split(" ")[1];

    // ====== KIỂM TRA TOKEN CÓ BỊ BLACKLIST KHÔNG ======

    // Hash token để dùng làm key trong Redis
    const tokenHash = hashToken(token);

    // Kiểm tra Redis xem token này có nằm trong blacklist không
    const isBlacklisted = await redis.get(
      `${REDIS_PREFIX.BLACKLIST}${tokenHash}`,
    );

    // Nếu token bị blacklist (ví dụ user đã logout)
    if (isBlacklisted) {
      throw new AppError("AUTH_TOKEN_BLACKLISTED");
    }

    // ====== VERIFY TOKEN ======

    // Kiểm tra chữ ký JWT và thời gian hết hạn
    const decoded = verifyAccessToken(token);

    // decoded thường chứa thông tin như:
    // { id: userId, iat: ..., exp: ... }

    // ====== LẤY USER TỪ DATABASE ======

    const user = await prisma.user.findFirst({
      where: {
        userId: decoded.id, // tìm user theo id trong token
        isDeleted: false, // user chưa bị xóa
      },
      select: {
        userId: true,
        userName: true,
        email: true,
        university: true,
        status: true,

        // lấy danh sách role của user
        userRoles: {
          where: { isDeleted: false },
          select: {
            role: {
              select: { code: true },
            },
          },
        },
      },
    });

    // Nếu không tìm thấy user trong database
    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    // ====== KIỂM TRA TRẠNG THÁI TÀI KHOẢN ======

    // Nếu tài khoản bị ban hoặc suspend
    if (
      user.status === USER_STATUS.BANNED ||
      user.status === USER_STATUS.SUSPENDED
    ) {
      throw new AppError("AUTH_ACCOUNT_LOCKED");
    }

    // Nếu tài khoản chưa kích hoạt
    if (user.status === USER_STATUS.INACTIVE) {
      throw new AppError("AUTH_ACCOUNT_PENDING");
    }

    // ====== GẮN THÔNG TIN USER VÀO REQUEST ======

    req.user = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      university: user.university,
      status: user.status,

      // chuyển danh sách role thành array
      roles: user.userRoles.map((ur) => ur.role.code),
    };

    // lưu token để dùng sau (ví dụ logout blacklist token)
    req.token = token;

    // Cho request đi tiếp tới middleware/controller tiếp theo
    next();
  } catch (err) {
    // Nếu là lỗi custom của hệ thống
    if (err instanceof AppError) {
      return next(err);
    }

    // Nếu token hết hạn
    if (err.name === "TokenExpiredError") {
      return next(new AppError("AUTH_TOKEN_EXPIRED"));
    }

    // Nếu token sai chữ ký hoặc không hợp lệ
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("AUTH_TOKEN_INVALID"));
    }

    // các lỗi khác
    next(err);
  }
};

// export middleware
module.exports = { protect };
