const nodemailer = require("nodemailer");

const CC_ADDRESS = "dat2801zz@gmail.com";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: parseInt(process.env.MAIL_PORT) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    cc: CC_ADDRESS,
    subject: "Khôi phục mật khẩu - Student Activity Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Khôi phục mật khẩu</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Bạn đã yêu cầu khôi phục mật khẩu. Nhấp vào nút bên dưới để đặt lại:</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p>Link có hiệu lực trong <strong>15 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        <hr/>
        <small style="color:#999;">Student Activity Portal</small>
      </div>
    `,
  });
};

const sendWelcomeEmail = async ({ to, name }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    cc: CC_ADDRESS,
    subject: "Chào mừng đến với Student Activity Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Đăng ký thành công!</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Tài khoản của bạn đã được tạo thành công trên <strong>Student Activity Portal</strong>.</p>
        <p>Bạn có thể đăng nhập và khám phá các hoạt động, CLB tại trường ngay bây giờ.</p>
        <hr/>
        <small style="color:#999;">Student Activity Portal</small>
      </div>
    `,
  });
};

const sendNotificationEmail = async ({ to, subject, body }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    cc: CC_ADDRESS,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <div>${body}</div>
        <hr/>
        <small style="color:#999;">Student Activity Portal</small>
      </div>
    `,
  });
};

const sendOtpEmail = async ({ to, name, otp }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Mã xác thực OTP - Student Activity Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xác thực tài khoản</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Mã OTP của bạn là:</p>
        <div style="margin: 24px 0; text-align: center;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #056382;">${otp}</span>
        </div>
        <p>Mã có hiệu lực trong <strong>10 phút</strong>.</p>
        <p>Nếu bạn không đăng ký, hãy bỏ qua email này.</p>
        <hr/>
        <small style="color:#999;">Student Activity Portal</small>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, sendNotificationEmail, sendOtpEmail };
