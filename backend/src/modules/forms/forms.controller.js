const formsService = require("./forms.service");
const exportService = require("./export.service");
const { success } = require("../../utils/response");

const createForm = async (req, res, next) => {
  try {
    const result = await formsService.createForm(req.body, req.user.userId);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getFormList = async (req, res, next) => {
  try {
    const result = await formsService.getFormList(req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getFormById = async (req, res, next) => {
  try {
    const result = await formsService.getFormById(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getFormPublic = async (req, res, next) => {
  try {
    const result = await formsService.getFormPublic(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateForm = async (req, res, next) => {
  try {
    const result = await formsService.updateForm(
      req.params.id,
      req.body,
      req.user.userId
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const deleteForm = async (req, res, next) => {
  try {
    await formsService.deleteForm(req.params.id, req.user.userId);
    return success(res, { message: "Form deleted" });
  } catch (err) {
    next(err);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const result = await formsService.changeStatus(
      req.params.id,
      req.body.status
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const submitForm = async (req, res, next) => {
  try {
    const result = await formsService.submitForm(
      req.params.id,
      req.body,
      req.user.userId
    );
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getResponses = async (req, res, next) => {
  try {
    const result = await formsService.getResponses(req.params.id, req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getResponseById = async (req, res, next) => {
  try {
    const result = await formsService.getResponseById(
      req.params.id,
      req.params.responseId
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const approveResponse = async (req, res, next) => {
  try {
    const result = await formsService.approveResponse(
      req.params.id,
      req.params.responseId,
      req.body.status
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const { buffer, filename } = await exportService.exportFormToExcel(
      req.params.id
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const exportGoogleSheets = async (req, res, next) => {
  try {
    const result = await exportService.exportFormToGoogleSheets(req.params.id);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getMyResponse = async (req, res, next) => {
  try {
    const result = await formsService.getMyResponse(req.params.id, req.user.userId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createForm,
  getFormList,
  getFormById,
  getFormPublic,
  updateForm,
  deleteForm,
  changeStatus,
  submitForm,
  getResponses,
  getResponseById,
  approveResponse,
  exportExcel,
  exportGoogleSheets,
  getMyResponse,
};
