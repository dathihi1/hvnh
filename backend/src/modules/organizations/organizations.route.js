const { Router } = require("express");
const controller = require("./organizations.controller");
const validate = require("../../middlewares/validate.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationsQuerySchema,
  addMemberSchema,
  updateMemberRoleSchema,
} = require("./organizations.validation");

const router = Router();

// ─── Public (không cần đăng nhập) ───────────────────────────────────────────
router.get("/", validateQuery(getOrganizationsQuerySchema), controller.getOrganizations);

// ─── Cần đăng nhập ──────────────────────────────────────────────────────────
router.get("/my", protect, authorize("organization_leader", "admin"), controller.getMyOrganization);

// ─── Parameterized routes (must come after specific named routes) ────────────
router.get("/:id/stats", controller.getOrgStats);
router.get("/:id/members", controller.getMembers);
router.get("/:id", controller.getOrganizationById);

// ─── Admin / Organization Leader ────────────────────────────────────────────
router.post(
  "/",
  protect,
  authorize("admin", "organization_leader"),
  validate(createOrganizationSchema),
  controller.createOrganization
);

router.put(
  "/:id",
  protect,
  authorize("admin", "organization_leader"),
  validate(updateOrganizationSchema),
  controller.updateOrganization
);

router.delete("/:id", protect, authorize("admin"), controller.deleteOrganization);

router.patch(
  "/:id/recruiting",
  protect,
  authorize("admin", "organization_leader"),
  controller.toggleRecruiting
);

router.patch(
  "/:id/recruitment/open",
  protect,
  authorize("admin", "organization_leader"),
  controller.openRecruitment
);

router.patch(
  "/:id/recruitment/close",
  protect,
  authorize("admin", "organization_leader"),
  controller.closeRecruitment
);

router.put(
  "/:id/recruitment",
  protect,
  authorize("admin", "organization_leader"),
  controller.updateRecruitmentSettings
);

// ─── Members ────────────────────────────────────────────────────────────────
router.post(
  "/:id/members",
  protect,
  authorize("admin", "organization_leader"),
  validate(addMemberSchema),
  controller.addMember
);

router.put(
  "/:id/members/:userId",
  protect,
  authorize("admin", "organization_leader"),
  validate(updateMemberRoleSchema),
  controller.updateMemberRole
);

router.delete(
  "/:id/members/:userId",
  protect,
  authorize("admin", "organization_leader"),
  controller.removeMember
);

router.post(
  "/:id/notify-candidates",
  protect,
  authorize("admin", "organization_leader"),
  controller.notifyCandidates
);

module.exports = router;
