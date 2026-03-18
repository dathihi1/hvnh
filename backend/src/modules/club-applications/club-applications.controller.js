const clubApplicationsService = require("./club-applications.service");
const { success } = require("../../utils/response");

const createApplication = async (req, res, next) => {
  try {
    const result = await clubApplicationsService.createApplication(req.body, req.user.userId);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const result = await clubApplicationsService.getMyApplications(req.user.userId, req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getApplicationsByActivity = async (req, res, next) => {
  try {
    const result = await clubApplicationsService.getApplicationsByActivity(
      req.params.activityId, req.query
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const result = await clubApplicationsService.getApplicationById(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateApplication = async (req, res, next) => {
  try {
    const result = await clubApplicationsService.updateApplication(
      req.params.id, req.body, req.user.userId, req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    await clubApplicationsService.softDeleteApplication(req.params.id, req.user.userId);
    return success(res, { message: "Rút đơn ứng tuyển thành công" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationsByActivity,
  getApplicationById,
  updateApplication,
  deleteApplication,
};
