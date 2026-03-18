const registrationsService = require("./registrations.service");
const { success } = require("../../utils/response");

const createRegistration = async (req, res, next) => {
  try {
    const result = await registrationsService.createRegistration(req.body, req.user.userId);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const result = await registrationsService.cancelRegistration(req.params.id, req.user.userId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getMyRegistrations = async (req, res, next) => {
  try {
    const result = await registrationsService.getMyRegistrations(req.user.userId, req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getRegistrationsByActivity = async (req, res, next) => {
  try {
    const result = await registrationsService.getRegistrationsByActivity(
      req.params.activityId, req.query
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getRegistrationById = async (req, res, next) => {
  try {
    const result = await registrationsService.getRegistrationById(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateRegistrationStatus = async (req, res, next) => {
  try {
    const result = await registrationsService.updateRegistrationStatus(
      req.params.id, req.body.status, req.user.userId, req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const bulkUpdateStatus = async (req, res, next) => {
  try {
    const result = await registrationsService.bulkUpdateStatus(
      req.body.registrationIds, req.body.status, req.user.userId
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const checkin = async (req, res, next) => {
  try {
    const result = await registrationsService.checkin(
      req.params.id, req.body.activityCheckinId, req.user.userId
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const checkout = async (req, res, next) => {
  try {
    const result = await registrationsService.checkout(
      req.params.id, req.body.activityCheckinId
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getActivityParticipantStats = async (req, res, next) => {
  try {
    const result = await registrationsService.getActivityParticipantStats(req.params.activityId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRegistration,
  cancelRegistration,
  getMyRegistrations,
  getRegistrationsByActivity,
  getRegistrationById,
  updateRegistrationStatus,
  bulkUpdateStatus,
  checkin,
  checkout,
  getActivityParticipantStats,
};
