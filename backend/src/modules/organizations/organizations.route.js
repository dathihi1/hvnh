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

router.use(protect);

// ─── Public (any authenticated user) ────────────────────────────────────────
router.get("/", validateQuery(getOrganizationsQuerySchema), controller.getOrganizations);
router.get("/:id", controller.getOrganizationById);

// ─── Admin / Organization Leader ────────────────────────────────────────────
router.post(
  "/",
  authorize("admin", "organization_leader"),
  validate(createOrganizationSchema),
  controller.createOrganization
);

router.put(
  "/:id",
  authorize("admin", "organization_leader"),
  validate(updateOrganizationSchema),
  controller.updateOrganization
);

router.delete("/:id", authorize("admin"), controller.deleteOrganization);

// ─── Members ────────────────────────────────────────────────────────────────
router.get("/:id/members", controller.getMembers);

router.post(
  "/:id/members",
  authorize("admin", "organization_leader"),
  validate(addMemberSchema),
  controller.addMember
);

router.put(
  "/:id/members/:userId",
  authorize("admin", "organization_leader"),
  validate(updateMemberRoleSchema),
  controller.updateMemberRole
);

router.delete(
  "/:id/members/:userId",
  authorize("admin", "organization_leader"),
  controller.removeMember
);

module.exports = router;
