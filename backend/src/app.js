const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const passport = require("./config/passport");
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
const chatSessionsRoutes = require("./modules/chat-sessions/chat-sessions.route");
const uploadRoutes = require("./modules/uploads/upload.route");
const systemConfigRoutes = require("./modules/system-config/system-config.route");
const universityRoutes = require("./modules/university/university.route");
const formsRoutes = require("./modules/forms/forms.route");

const app = express();

// ─── Trust Nginx reverse proxy ────────────────────────────────────────────────
app.set("trust proxy", 1);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) return callback(null, true);
      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        /^https:\/\/[a-z0-9-]+-[a-z0-9]+-[a-z0-9-]+\.vercel\.app$/.test(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 500 : 2000,
    message: { success: false, error: "Quá nhiều yêu cầu, thử lại sau" },
    skip: () => process.env.NODE_ENV === "development",
  }),
);

// ─── Disable ETags for API responses (prevent stale 304 on dynamic data) ─────
app.set("etag", false);

// ─── Passport (OAuth) ─────────────────────────────────────────────────────────
app.use(passport.initialize());

// ─── Body parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Static files (legacy — uploads now go through S3) ──────────────────────
// Removed: app.use("/uploads", express.static(...));

// ─── Logging (dev only) ───────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(require("morgan")("dev"));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "OK",
    timestamp: new Date().toISOString(),
  });
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
app.use("/api/chat-sessions", chatSessionsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/system-config", systemConfigRoutes);
app.use("/api/university", universityRoutes);
app.use("/api/forms", formsRoutes);

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
