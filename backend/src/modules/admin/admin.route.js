const { Router } = require("express");
const controller = require("./admin.controller");
const validate = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");
const { createUserSchema } = require("./admin.validation");

const router = Router();

router.use(protect);
router.use(authorize("admin"));

// Stats
router.get("/stats/overview", controller.getOverviewStats);
router.get("/stats/activities", controller.getActivityStats);

// User management — create single user
router.post("/users", validate(createUserSchema), controller.createUser);

// CSV import — accepts raw text/csv body OR JSON { csv: "..." }
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

module.exports = router;
