const { Router } = require("express");
const controller = require("./registrations.controller");
const validate = require("../../middlewares/validate.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const {
  createRegistrationSchema,
  getRegistrationsQuerySchema,
  getMyRegistrationsQuerySchema,
  updateRegistrationStatusSchema,
  bulkUpdateStatusSchema,
  checkinSchema,
} = require("./registrations.validation");

const router = Router();

router.use(protect);

// ─── Student (any authenticated) ────────────────────────────────────────────
router.post("/", validate(createRegistrationSchema), controller.createRegistration);
router.get("/my", validateQuery(getMyRegistrationsQuerySchema), controller.getMyRegistrations);
router.get("/:id", controller.getRegistrationById);
router.put("/:id/cancel", controller.cancelRegistration);
router.post("/:id/checkin", validate(checkinSchema), controller.checkin);
router.put("/:id/checkout", validate(checkinSchema), controller.checkout);

// ─── Admin / Organization Leader ────────────────────────────────────────────
router.get(
  "/activity/:activityId",
  authorize("admin", "organization_leader"),
  validateQuery(getRegistrationsQuerySchema),
  controller.getRegistrationsByActivity
);

router.get(
  "/activity/:activityId/stats",
  authorize("admin", "organization_leader"),
  controller.getActivityParticipantStats
);

router.put(
  "/:id/status",
  authorize("admin", "organization_leader"),
  validate(updateRegistrationStatusSchema),
  controller.updateRegistrationStatus
);

router.put(
  "/bulk-status",
  authorize("admin", "organization_leader"),
  validate(bulkUpdateStatusSchema),
  controller.bulkUpdateStatus
);

module.exports = router;
