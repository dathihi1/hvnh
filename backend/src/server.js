require("dotenv").config();

const { validateEnv } = require("./config/env");
const connectDB = require("./config/db");
const { connectRedis, disconnectRedis } = require("./config/redis");
const {
  startNotificationWorker,
  stopNotificationWorker,
} = require("./workers/notification.worker");
const {
  startRegistrationWorker,
  stopRegistrationWorker,
} = require("./workers/registration.worker");
const { closeQueues } = require("./config/bullmq");
const app = require("./app");

validateEnv();

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  await connectRedis();

  startNotificationWorker();
  startRegistrationWorker();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

start();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err.message);
  process.exit(1);
});

const gracefulShutdown = async () => {
  await stopNotificationWorker();
  await stopRegistrationWorker();
  await closeQueues();
  await disconnectRedis();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
