const adminService = require("./admin.service");
const { success } = require("../../utils/response");

const getOverviewStats = async (req, res, next) => {
  try {
    const data = await adminService.getOverviewStats();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getActivityStats = async (req, res, next) => {
  try {
    const data = await adminService.getActivityStats();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body, req.user.userId);
    return success(res, user, 201);
  } catch (err) {
    next(err);
  }
};

const importUsersFromCSV = async (req, res, next) => {
  try {
    // Accept CSV as: raw text/csv body OR JSON { csv: "..." }
    const csvText =
      typeof req.body === "string"
        ? req.body
        : req.body?.csv;

    if (!csvText) {
      return res.status(400).json({
        success: false,
        error: "No CSV data provided. Send raw CSV (Content-Type: text/csv) or JSON { csv: '...' }",
      });
    }

    const result = await adminService.importUsersFromCSV(csvText, req.user.userId);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getRegistrationTrend = async (req, res, next) => {
  try {
    const months = Number(req.query.months) || 6;
    const data = await adminService.getRegistrationTrend(months);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const createOrganization = async (req, res, next) => {
  try {
    const org = await adminService.createOrganization(req.body, req.user.userId);
    return success(res, org, 201);
  } catch (err) {
    next(err);
  }
};

const importOrgsFromCSV = async (req, res, next) => {
  try {
    const csvText =
      typeof req.body === "string"
        ? req.body
        : req.body?.csv;

    if (!csvText) {
      return res.status(400).json({
        success: false,
        error: "No CSV data provided. Send raw CSV (Content-Type: text/csv) or JSON { csv: '...' }",
      });
    }

    const result = await adminService.importOrgsFromCSV(csvText, req.user.userId);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const data = await adminService.listUsers(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

const adminUpdateUser = async (req, res, next) => {
  try {
    const data = await adminService.adminUpdateUser(req.params.id, req.body, req.user.userId);
    return success(res, data);
  } catch (err) { next(err); }
};

const adminDeleteUser = async (req, res, next) => {
  try {
    await adminService.adminDeleteUser(req.params.id, req.user.userId);
    return success(res, { message: "Xóa tài khoản thành công" });
  } catch (err) { next(err); }
};

const adminToggleUserStatus = async (req, res, next) => {
  try {
    const data = await adminService.adminToggleUserStatus(req.params.id, req.body.status, req.user.userId);
    return success(res, data);
  } catch (err) { next(err); }
};

const listOrganizations = async (req, res, next) => {
  try {
    const data = await adminService.listOrganizations(req.query);
    return success(res, data);
  } catch (err) { next(err); }
};

const adminUpdateOrganization = async (req, res, next) => {
  try {
    const data = await adminService.adminUpdateOrganization(req.params.id, req.body, req.user.userId);
    return success(res, data);
  } catch (err) { next(err); }
};

const adminDeleteOrganization = async (req, res, next) => {
  try {
    await adminService.adminDeleteOrganization(req.params.id, req.user.userId);
    return success(res, { message: "Xóa tổ chức thành công" });
  } catch (err) { next(err); }
};

const adminToggleOrgStatus = async (req, res, next) => {
  try {
    const data = await adminService.adminToggleOrgStatus(req.params.id, req.body.status, req.user.userId);
    return success(res, data);
  } catch (err) { next(err); }
};

const promoteUser = async (req, res, next) => {
  try {
    const data = await adminService.promoteUser(req.params.id, req.body, req.user.userId);
    return success(res, data);
  } catch (err) { next(err); }
};

module.exports = {
  getOverviewStats, getActivityStats, getRegistrationTrend,
  createUser, importUsersFromCSV,
  createOrganization, importOrgsFromCSV,
  listUsers, adminUpdateUser, adminDeleteUser, adminToggleUserStatus,
  promoteUser,
  listOrganizations, adminUpdateOrganization, adminDeleteOrganization, adminToggleOrgStatus,
};
