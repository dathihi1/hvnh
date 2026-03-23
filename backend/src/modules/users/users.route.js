const { Router } = require("express");
const controller = require("./users.controller");
const validate = require("../../middlewares/validate.middleware");
const { validateQuery } = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const {
  updateProfileSchema,
  getUsersQuerySchema,
  updateUserStatusSchema,
} = require("./users.validation");

const router = Router();

router.use(protect);

// ─── Public lookup (all authenticated users) ────────────────────────────────
router.get("/lookup", controller.lookupByEmail);

// ─── Current user ───────────────────────────────────────────────────────────
router.get("/me", controller.getMe);
router.get("/me/activities", controller.getUserActivities);
router.get("/me/organizations", controller.getUserOrganizations);
router.put("/me", validate(updateProfileSchema), controller.updateProfile);

// ─── Admin ──────────────────────────────────────────────────────────────────
router.get("/", authorize("admin"), validateQuery(getUsersQuerySchema), controller.getUsers);
router.get("/:id", controller.getUserById);
router.put("/:id/status", authorize("admin"), validate(updateUserStatusSchema), controller.updateUserStatus);
router.delete("/:id", authorize("admin"), controller.deleteUser);

module.exports = router;
