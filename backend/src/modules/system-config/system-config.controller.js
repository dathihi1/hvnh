const configService = require("./system-config.service");
const { success } = require("../../utils/response");

const getAllConfigs = async (req, res, next) => {
  try {
    const data = await configService.getAllConfigs();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getConfigsByCategory = async (req, res, next) => {
  try {
    const data = await configService.getConfigsByCategory(req.params.category);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getConfigByKey = async (req, res, next) => {
  try {
    const organizationId = req.query.organizationId || null;
    const data = await configService.getConfigByKey(req.params.key, organizationId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const updateConfig = async (req, res, next) => {
  try {
    const { value, organizationId } = req.body;
    const data = await configService.updateConfig(
      req.params.key,
      value,
      req.user.userId,
      organizationId || null,
    );
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getOverridesByKey = async (req, res, next) => {
  try {
    const data = await configService.getOverridesByKey(req.params.key);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getOrgOverrides = async (req, res, next) => {
  try {
    const data = await configService.getOrgOverrides(req.params.organizationId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const deleteOrgOverride = async (req, res, next) => {
  try {
    const data = await configService.deleteOrgOverride(
      req.params.key,
      req.params.organizationId,
      req.user.userId,
    );
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getMyOrgConfig = async (req, res, next) => {
  try {
    const data = await configService.getMyOrgConfig(req.params.key, req.user.userId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const updateMyOrgConfig = async (req, res, next) => {
  try {
    const { value } = req.body;
    const data = await configService.updateMyOrgConfig(req.params.key, value, req.user.userId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllConfigs,
  getConfigsByCategory,
  getConfigByKey,
  getOverridesByKey,
  updateConfig,
  getOrgOverrides,
  deleteOrgOverride,
  getMyOrgConfig,
  updateMyOrgConfig,
};
