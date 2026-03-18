const { Router } = require("express");
const controller = require("./club-applications.controller");
const validate = require("../../middlewares/validate.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const {
  createApplicationSchema,
  updateApplicationSchema,
  getApplicationsQuerySchema,
} = require("./club-applications.validation");

const router = Router();

router.use(protect);

// ─── Student ────────────────────────────────────────────────────────────────
router.post("/", validate(createApplicationSchema), controller.createApplication);
router.get("/my", controller.getMyApplications);
router.get("/:id", controller.getApplicationById);
router.delete("/:id", controller.deleteApplication);

// ─── Admin / Organization Leader ────────────────────────────────────────────
router.get(
  "/activity/:activityId",
  authorize("admin", "organization_leader"),
  validateQuery(getApplicationsQuerySchema),
  controller.getApplicationsByActivity
);

router.put(
  "/:id",
  authorize("admin", "organization_leader"),
  validate(updateApplicationSchema),
  controller.updateApplication
);

module.exports = router;
