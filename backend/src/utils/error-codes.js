module.exports = {
  // ─── Auth ──────────────────────────────────────────────
  AUTH_EMAIL_EXISTS:      { statusCode: 409, message: "Email đã được sử dụng" },
  AUTH_INVALID_CREDS:     { statusCode: 401, message: "Email hoặc mật khẩu không đúng" },
  AUTH_ACCOUNT_LOCKED:    { statusCode: 403, message: "Tài khoản đã bị khóa" },
  AUTH_ACCOUNT_PENDING:   { statusCode: 403, message: "Tài khoản đang chờ phê duyệt" },
  AUTH_WRONG_PASSWORD:    { statusCode: 400, message: "Mật khẩu cũ không đúng" },
  AUTH_TOKEN_MISSING:     { statusCode: 401, message: "Không có token xác thực" },
  AUTH_TOKEN_BLACKLISTED: { statusCode: 401, message: "Token đã bị đăng xuất" },
  AUTH_TOKEN_EXPIRED:     { statusCode: 401, message: "Token đã hết hạn" },
  AUTH_TOKEN_INVALID:     { statusCode: 401, message: "Token không hợp lệ" },
  AUTH_REFRESH_INVALID:   { statusCode: 401, message: "Refresh token không hợp lệ" },
  AUTH_RESET_INVALID:     { statusCode: 400, message: "Link khôi phục không hợp lệ hoặc đã hết hạn" },

  // ─── User ──────────────────────────────────────────────
  USER_NOT_FOUND:         { statusCode: 404, message: "Người dùng không tồn tại" },

  // ─── Activity ─────────────────────────────────────────
  ACTIVITY_NOT_FOUND:         { statusCode: 404, message: "Hoạt động không tồn tại" },
  ACTIVITY_CANNOT_MODIFY:     { statusCode: 400, message: "Không thể chỉnh sửa hoạt động ở trạng thái này" },
  ACTIVITY_INVALID_TRANSITION:{ statusCode: 400, message: "Chuyển trạng thái hoạt động không hợp lệ" },
  CATEGORY_NOT_FOUND:         { statusCode: 404, message: "Danh mục không tồn tại" },

  // ─── Registration ─────────────────────────────────────
  REGISTRATION_NOT_FOUND:       { statusCode: 404, message: "Đăng ký không tồn tại" },
  REGISTRATION_DUPLICATE:       { statusCode: 409, message: "Bạn đã đăng ký hoạt động này" },
  REGISTRATION_FULL:            { statusCode: 400, message: "Hoạt động đã đủ số lượng" },
  REGISTRATION_DEADLINE_PASSED: { statusCode: 400, message: "Đã quá hạn đăng ký" },
  REGISTRATION_CANNOT_CANCEL:   { statusCode: 400, message: "Không thể hủy đăng ký ở trạng thái này" },
  REGISTRATION_NOT_APPROVED:    { statusCode: 400, message: "Đăng ký chưa được phê duyệt" },

  // ─── Organization ─────────────────────────────────────
  ORGANIZATION_NOT_FOUND:     { statusCode: 404, message: "Tổ chức không tồn tại" },
  ORGANIZATION_MEMBER_EXISTS: { statusCode: 409, message: "Thành viên đã tồn tại trong tổ chức" },
  ORGANIZATION_NOT_MEMBER:    { statusCode: 403, message: "Bạn không phải thành viên của tổ chức này" },

  // ─── Club Application ────────────────────────────────
  APPLICATION_NOT_FOUND:       { statusCode: 404, message: "Đơn ứng tuyển không tồn tại" },
  APPLICATION_DUPLICATE:       { statusCode: 409, message: "Bạn đã nộp đơn ứng tuyển cho hoạt động này" },
  APPLICATION_ALREADY_DECIDED: { statusCode: 400, message: "Đơn ứng tuyển đã được xử lý" },

  // ─── Checkin ──────────────────────────────────────────
  CHECKIN_SESSION_NOT_FOUND:   { statusCode: 404, message: "Phiên điểm danh không tồn tại" },
  CHECKIN_ALREADY_EXISTS:      { statusCode: 409, message: "Đã điểm danh cho phiên này" },

  // ─── Notification ─────────────────────────────────────
  NOTIFICATION_NOT_FOUND:      { statusCode: 404, message: "Thông báo không tồn tại" },
  NOTIFICATION_SEND_FAILED:    { statusCode: 500, message: "Gửi thông báo thất bại" },
  NOTIFICATION_NO_RECIPIENTS:  { statusCode: 400, message: "Không có người nhận nào" },

  // ─── AI ───────────────────────────────────────────────
  AI_SERVICE_UNAVAILABLE:      { statusCode: 503, message: "Dịch vụ AI tạm thời không khả dụng" },

  // ─── Common ────────────────────────────────────────────
  FORBIDDEN:              { statusCode: 403, message: "Bạn không có quyền thực hiện thao tác này" },
  VALIDATION_ERROR:       { statusCode: 400, message: "Dữ liệu không hợp lệ" },
  NOT_FOUND:              { statusCode: 404, message: "Không tìm thấy tài nguyên" },
  INTERNAL_ERROR:         { statusCode: 500, message: "Lỗi hệ thống" },
};
