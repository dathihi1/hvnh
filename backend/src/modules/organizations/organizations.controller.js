const organizationsService = require("./organizations.service");
const { success } = require("../../utils/response");

const createOrganization = async (req, res, next) => {
  try {
    const result = await organizationsService.createOrganization(req.body, req.user.userId);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getOrganizations = async (req, res, next) => {
  try {
    const result = await organizationsService.getOrganizations(req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getOrganizationById = async (req, res, next) => {
  try {
    const result = await organizationsService.getOrganizationById(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const result = await organizationsService.updateOrganization(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const deleteOrganization = async (req, res, next) => {
  try {
    await organizationsService.softDeleteOrganization(req.params.id, req.user.userId);
    return success(res, { message: "Xóa tổ chức thành công" });
  } catch (err) {
    next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const result = await organizationsService.getMembers(req.params.id, req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const result = await organizationsService.addMember(
      req.params.id,
      req.body.userId,
      req.body.role,
      req.user.userId,
      req.user.roles
    );
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const result = await organizationsService.updateMemberRole(
      req.params.id,
      req.params.userId,
      req.body.role,
      req.user.userId,
      req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    await organizationsService.removeMember(
      req.params.id,
      req.params.userId,
      req.user.userId,
      req.user.roles
    );
    return success(res, { message: "Xóa thành viên thành công" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
};
