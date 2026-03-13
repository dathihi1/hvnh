const authService = require("./auth.service");
const { success } = require("../../utils/response");

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.token, req.user.userId);
    return success(res, { message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, error: "Missing refresh token" });
    }
    const result = await authService.refreshToken(refreshToken);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    return success(res, {
      message: "If the email exists, a reset link has been sent",
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    return success(res, { message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(
      req.user.userId,
      req.body.oldPassword,
      req.body.newPassword
    );
    return success(res, { message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  return success(res, { user: req.user });
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};
