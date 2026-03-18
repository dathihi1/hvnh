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
} = require("./activities.validation");

const router = Router();

router.use(protect);

// ─── Public (any authenticated user) ────────────────────────────────────────
router.get("/categories", controller.getCategories);
router.get("/", validateQuery(getActivitiesQuerySchema), controller.getActivities);
router.get("/:id", controller.getActivityById);

// ─── Admin / Organization Leader ────────────────────────────────────────────
router.post(
  "/",
  authorize("admin", "organization_leader"),
  validate(createActivitySchema),
  controller.createActivity
);

router.put(
  "/:id",
  authorize("admin", "organization_leader"),
  validate(updateActivitySchema),
  controller.updateActivity
);

router.put(
  "/:id/status",
  authorize("admin", "organization_leader"),
  validate(updateActivityStatusSchema),
  controller.updateActivityStatus
);

router.delete(
  "/:id",
  authorize("admin", "organization_leader"),
  controller.deleteActivity
);

// ─── Categories (admin only) ────────────────────────────────────────────────
router.post(
  "/categories",
  authorize("admin"),
  validate(createCategorySchema),
  controller.createCategory
);

// ─── Checkin sessions (admin / org leader) ──────────────────────────────────
router.post(
  "/:id/checkin-sessions",
  authorize("admin", "organization_leader"),
  validate(createCheckinSessionSchema),
  controller.createCheckinSession
);

router.get(
  "/:id/checkin-sessions",
  authorize("admin", "organization_leader"),
  controller.getCheckinSessions
);

module.exports = router;
