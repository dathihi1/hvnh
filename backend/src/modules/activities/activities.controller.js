const activitiesService = require("./activities.service");
const { success } = require("../../utils/response");

const createActivity = async (req, res, next) => {
  try {
    const result = await activitiesService.createActivity(req.body, req.user.userId, req.user.roles);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getActivities = async (req, res, next) => {
  try {
    const result = await activitiesService.getActivities(req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getActivityById = async (req, res, next) => {
  try {
    const result = await activitiesService.getActivityById(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateActivity = async (req, res, next) => {
  try {
    const result = await activitiesService.updateActivity(
      req.params.id, req.body, req.user.userId, req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateActivityStatus = async (req, res, next) => {
  try {
    const result = await activitiesService.updateActivityStatus(
      req.params.id, req.body.activityStatus, req.user.userId, req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const deleteActivity = async (req, res, next) => {
  try {
    await activitiesService.softDeleteActivity(req.params.id, req.user.userId, req.user.roles);
    return success(res, { message: "Xóa hoạt động thành công" });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const result = await activitiesService.getCategories();
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const result = await activitiesService.createCategory(req.body, req.user.userId);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const createCheckinSession = async (req, res, next) => {
  try {
    const result = await activitiesService.createCheckinSession(
      req.params.id, req.body, req.user.userId, req.user.roles
    );
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getCheckinSessions = async (req, res, next) => {
  try {
    const result = await activitiesService.getCheckinSessions(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  updateActivityStatus,
  deleteActivity,
  getCategories,
  createCategory,
  createCheckinSession,
  getCheckinSessions,
};
