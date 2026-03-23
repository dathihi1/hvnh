const { Router } = require("express");
const controller = require("./activities.controller");
const validate = require("../../middlewares/validate.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const {
  createActivitySchema,
  updateActivitySchema,
  updateActivityStatusSchema,
  getActivitiesQuerySchema,
  createCategorySchema,
  createCheckinSessionSchema,
  openCheckinBodySchema,
} = require("./activities.validation");

const router = Router();

// ─── Public (không cần đăng nhập) ───────────────────────────────────────────
router.get("/categories", controller.getCategories);
router.get("/", validateQuery(getActivitiesQuerySchema), controller.getActivities);

// ─── Org leader / Admin: activities they manage ──────────────────────────────
// IMPORTANT: must be registered BEFORE /:id to avoid Express matching "my-org" as an id
router.get(
  "/my-org",
  protect,
  authorize("admin", "organization_leader"),
  validateQuery(getActivitiesQuerySchema),
  controller.getMyOrgActivities
);

router.get("/:id", controller.getActivityById);

// ─── Admin / Organization Leader ────────────────────────────────────────────
router.post(
  "/",
  protect,
  authorize("admin", "organization_leader"),
  validate(createActivitySchema),
  controller.createActivity
);

router.put(
  "/:id",
  protect,
  authorize("admin", "organization_leader"),
  validate(updateActivitySchema),
  controller.updateActivity
);

router.put(
  "/:id/status",
  protect,
  authorize("admin", "organization_leader"),
  validate(updateActivityStatusSchema),
  controller.updateActivityStatus
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "organization_leader"),
  controller.deleteActivity
);

// ─── Categories (admin only) ────────────────────────────────────────────────
router.post(
  "/categories",
  protect,
  authorize("admin"),
  validate(createCategorySchema),
  controller.createCategory
);

// ─── Checkin sessions (admin / org leader) ──────────────────────────────────
router.post(
  "/:id/checkin-sessions",
  protect,
  authorize("admin", "organization_leader"),
  validate(createCheckinSessionSchema),
  controller.createCheckinSession
);

router.get(
  "/:id/checkin-sessions",
  protect,
  authorize("admin", "organization_leader"),
  controller.getCheckinSessions
);

router.post(
  "/:id/checkin-sessions/open",
  protect,
  authorize("admin", "organization_leader"),
  validate(openCheckinBodySchema),
  controller.openCheckin
);

router.patch(
  "/:id/checkin-sessions/:checkinId/close-checkin",
  protect,
  authorize("admin", "organization_leader"),
  controller.closeCheckin
);

router.patch(
  "/:id/checkin-sessions/:checkinId/open-checkout",
  protect,
  authorize("admin", "organization_leader"),
  controller.openCheckout
);

router.patch(
  "/:id/checkin-sessions/:checkinId/close-checkout",
  protect,
  authorize("admin", "organization_leader"),
  controller.closeCheckout
);

router.patch(
  "/:id/checkin-sessions/:checkinId/extend-checkin",
  protect,
  authorize("admin", "organization_leader"),
  controller.extendCheckin
);

router.patch(
  "/:id/checkin-sessions/:checkinId/extend-checkout",
  protect,
  authorize("admin", "organization_leader"),
  controller.extendCheckout
);

module.exports = router;
