const express = require("express");

const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

const {
  createOrganizationController,
  getOrganizationsController,
  getOrganizationByIdController,
  getOrganizationsByNameController,
  getOrganizationsByTypeController,
  updateOrganizationController,
  deleteOrganizationController,
} = require("./organizations.controller");

const router = express.Router();
const {
  createOrganizationSchema,
  updateOrganizationSchema,
} = require("./organizations.validation");
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((e) => e.message),
      });
    }

    next();
  };
};
/**
 * ============================
 * Organization Routes
 * ============================
 */

router.post(
  "/",
  protect,
  authorize("admin"),
  validate(createOrganizationSchema),
  createOrganizationController,
);
router.get("/", protect, authorize("admin"), getOrganizationsController);
router.get(
  "/searchName",
  protect,
  authorize("admin"),
  getOrganizationsByNameController,
);
router.get(
  "/searchType",
  protect,
  authorize("admin"),
  getOrganizationsByTypeController,
);
router.get(
  "/:organizationId",
  protect,
  authorize("admin"),
  getOrganizationByIdController,
);

router.put(
  "/:organizationId",
  protect,
  authorize("admin"),
  validate(updateOrganizationSchema),
  updateOrganizationController,
);
router.delete(
  "/:organizationId",
  protect,
  authorize("admin"),
  deleteOrganizationController,
);

module.exports = router;
