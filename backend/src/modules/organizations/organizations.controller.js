const organizationsService = require("./organizations.service");
const { success } = require("../../utils/response");
const { getNotificationQueue } = require("../../config/bullmq");
const prisma = require("../../config/prisma");

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

const getMyOrganization = async (req, res, next) => {
  try {
    const result = await organizationsService.getMyOrganization(req.user.userId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getOrgStats = async (req, res, next) => {
  try {
    const result = await organizationsService.getOrgStats(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const toggleRecruiting = async (req, res, next) => {
  try {
    const { isRecruiting } = req.body;
    const result = await organizationsService.toggleRecruiting(
      req.params.id, Boolean(isRecruiting), req.user.userId, req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const openRecruitment = async (req, res, next) => {
  try {
    const result = await organizationsService.openRecruitment(
      req.params.id, req.body, req.user.userId, req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const closeRecruitment = async (req, res, next) => {
  try {
    const result = await organizationsService.closeRecruitment(
      req.params.id, req.user.userId, req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateRecruitmentSettings = async (req, res, next) => {
  try {
    const result = await organizationsService.updateRecruitmentSettings(
      req.params.id, req.body, req.user.userId, req.user.roles
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const notifyCandidates = async (req, res, next) => {
  try {
    const { userIds, subject, message } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0 || !subject || !message) {
      return res.status(400).json({ success: false, message: "userIds, subject, message required" });
    }

    // Verify each user exists
    const users = await prisma.user.findMany({
      where: { userId: { in: userIds.map(Number) }, isDeleted: false },
      select: { userId: true, email: true },
    });

    const queue = getNotificationQueue();
    const jobs = users.map((u) =>
      queue.add(
        "notify-candidate",
        { userId: u.userId, title: subject, content: message, channels: ["EMAIL"] },
        { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
      )
    );
    await Promise.all(jobs);

    return success(res, { queued: users.length });
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
  getMyOrganization,
  getOrgStats,
  toggleRecruiting,
  openRecruitment,
  closeRecruitment,
  notifyCandidates,
  updateRecruitmentSettings,
};
