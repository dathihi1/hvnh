const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const errorMiddleware = require("./middlewares/error.middleware");
const authRoutes = require("./modules/auth/auth.route");
const usersRoutes = require("./modules/users/users.route");
const organizationsRoutes = require("./modules/organizations/organizations.route");
const activitiesRoutes = require("./modules/activities/activities.route");
const registrationsRoutes = require("./modules/registrations/registrations.route");
const clubApplicationsRoutes = require("./modules/club-applications/club-applications.route");
const notificationsRoutes = require("./modules/notifications/notifications.route");
const adminRoutes = require("./modules/admin/admin.route");
const aiRoutes = require("./modules/ai/ai.route");

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: "Quá nhiều yêu cầu, thử lại sau" },
  })
);

// ─── Body parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging (dev only) ───────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(require("morgan")("dev"));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ success: true, message: "OK", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/organizations", organizationsRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/registrations", registrationsRoutes);
app.use("/api/club-applications", clubApplicationsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} không tồn tại`,
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
