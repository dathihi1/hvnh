const notificationsService = require("./notifications.service");
const { success } = require("../../utils/response");

const sendNotification = async (req, res, next) => {
  try {
    const result = await notificationsService.sendNotification(
      req.body,
      req.user.userId
    );
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const sendBulkNotification = async (req, res, next) => {
  try {
    const result = await notificationsService.sendBulkNotification(
      req.body,
      req.user.userId
    );
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const result = await notificationsService.getMyNotifications(
      req.user.userId,
      req.query
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getNotificationById = async (req, res, next) => {
  try {
    const result = await notificationsService.getNotificationById(
      req.params.id,
      req.user.userId
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationsService.markAsRead(
      req.params.id,
      req.user.userId
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationsService.markAllAsRead(req.user.userId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await notificationsService.deleteNotification(
      req.params.id,
      req.user.userId
    );
    return success(res, { message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const result = await notificationsService.getUnreadCount(req.user.userId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendNotification,
  sendBulkNotification,
  getMyNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getStats,
};
