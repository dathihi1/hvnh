// Optional: Validate environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_EXPIRE",
  "JWT_REFRESH_SECRET",
  "JWT_REFRESH_EXPIRE",
  "FRONTEND_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  console.log("✅ All required environment variables are set");
};

module.exports = { validateEnv };
