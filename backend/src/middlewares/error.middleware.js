// Middleware xử lý lỗi toàn cục của Express
const errorMiddleware = (err, req, res, next) => {

  // Nếu lỗi có statusCode thì dùng, không thì mặc định 500 (lỗi server)
  const statusCode = err.statusCode || 500;

  // Mã lỗi nội bộ của hệ thống (ví dụ AUTH_TOKEN_INVALID)
  // Nếu không có thì mặc định INTERNAL_ERROR
  const code = err.code || "INTERNAL_ERROR";

  // Thông báo lỗi trả về cho client
  const message = err.message || "Lỗi hệ thống";


  // Nếu đang chạy ở môi trường development
  // thì in log lỗi ra console để dev dễ debug
  if (process.env.NODE_ENV === "development") {
    console.error(`[${code}] ${req.method} ${req.originalUrl} - ${message}`);
  }


  // Trả response lỗi về cho client
  return res.status(statusCode).json({
    success: false,      // báo request thất bại
    statusCode,          // HTTP status code
    code,                // mã lỗi nội bộ
    message,             // thông báo lỗi

    // Chỉ khi ở môi trường development mới trả thêm stack trace
    // để dev biết lỗi xảy ra ở đâu
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// export middleware để dùng trong app.js
module.exports = errorMiddleware;