const usersService = require("./users.service");
const { success } = require("../../utils/response");

const getUsers = async (req, res, next) => {
  try {
    const result = await usersService.getUsers(req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const result = await usersService.getUserById(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await usersService.updateProfile(req.user.userId, req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const result = await usersService.updateUserStatus(
      req.params.id,
      req.body.status,
      req.user.userId
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await usersService.softDeleteUser(req.params.id, req.user.userId);
    return success(res, { message: "Xóa người dùng thành công" });
  } catch (err) {
    next(err);
  }
};

const getUserActivities = async (req, res, next) => {
  try {
    const result = await usersService.getUserActivities(req.user.userId, req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getUserOrganizations = async (req, res, next) => {
  try {
    const result = await usersService.getUserOrganizations(req.user.userId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  updateUserStatus,
  deleteUser,
  getUserActivities,
  getUserOrganizations,
};
