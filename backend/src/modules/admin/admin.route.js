const { Router } = require("express");
const controller = require("./admin.controller");
const validate = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const { createUserSchema, createOrganizationSchema } = require("./admin.validation");

const router = Router();

router.use(protect);
router.use(authorize("admin"));

// Stats
router.get("/stats/overview", controller.getOverviewStats);
router.get("/stats/activities", controller.getActivityStats);
router.get("/stats/registrations", controller.getRegistrationTrend);

// ─── User management ─────────────────────────────────────────────────────────

// Tạo tài khoản đơn lẻ
router.post("/users", validate(createUserSchema), controller.createUser);

// Import hàng loạt
router.post(
  "/users/import",
  (req, res, next) => {
    const ct = req.headers["content-type"] || "";
    if (ct.includes("text/csv") || ct.includes("text/plain")) {
      let data = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => { data += chunk; });
      req.on("end", () => { req.body = data; next(); });
    } else {
      next();
    }
  },
  controller.importUsersFromCSV
);

// Danh sách, chỉnh sửa, xóa, khóa/mở khóa user
router.get("/users", controller.listUsers);
router.put("/users/:id", controller.adminUpdateUser);
router.delete("/users/:id", controller.adminDeleteUser);
router.patch("/users/:id/status", controller.adminToggleUserStatus);
router.post("/users/:id/promote", controller.promoteUser);

// ─── Organization management ──────────────────────────────────────────────────

// Tạo tổ chức đơn lẻ
router.post("/organizations", validate(createOrganizationSchema), controller.createOrganization);

// Import hàng loạt
const csvMiddleware = (req, res, next) => {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("text/csv") || ct.includes("text/plain")) {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => { req.body = data; next(); });
  } else {
    next();
  }
};

router.post("/organizations/import", csvMiddleware, controller.importOrgsFromCSV);

// Danh sách, chỉnh sửa, xóa, khóa/mở khóa organization
router.get("/organizations", controller.listOrganizations);
router.put("/organizations/:id", controller.adminUpdateOrganization);
router.delete("/organizations/:id", controller.adminDeleteOrganization);
router.patch("/organizations/:id/status", controller.adminToggleOrgStatus);

module.exports = router;
