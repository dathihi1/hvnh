const { Router } = require("express");
const controller = require("./notifications.controller");
const validate = require("../../middlewares/validate.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const {
  sendNotificationSchema,
  sendBulkNotificationSchema,
  getNotificationsSchema,
} = require("./notifications.validation");

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app, email, and SMS notification management
 */

router.use(protect);

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send a notification to a single user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Notification sent
 */
router.post(
  "/send",
  authorize("admin", "organization_leader"),
  validate(sendNotificationSchema),
  controller.sendNotification
);

/**
 * @swagger
 * /api/notifications/send-bulk:
 *   post:
 *     summary: Send a notification to multiple users
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Bulk notifications queued
 */
router.post(
  "/send-bulk",
  authorize("admin", "organization_leader"),
  validate(sendBulkNotificationSchema),
  controller.sendBulkNotification
);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get unread notification count for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get("/stats", controller.getStats);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.put("/read-all", controller.markAllAsRead);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: List notifications for the current user (paginated)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: notificationType
 *         schema: { type: string, enum: [system, activity, registration] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [unread, read] }
 *     responses:
 *       200:
 *         description: Paginated notifications
 */
router.get("/", validateQuery(getNotificationsSchema), controller.getMyNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get a single notification by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification details
 *       404:
 *         description: Not found
 */
router.get("/:id", controller.getNotificationById);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.put("/:id/read", controller.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete("/:id", controller.deleteNotification);

module.exports = router;
