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

module.exports = { getOverviewStats, getActivityStats, createUser, importUsersFromCSV };
