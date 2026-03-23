const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 10) return null; // stop retrying after 10 attempts
    return Math.min(times * 200, 5000); // exponential backoff, max 5s
  },
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  enableReadyCheck: true,
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

redis.on("reconnecting", (delay) => {
  console.warn(`Redis reconnecting in ${delay}ms`);
});

const connectRedis = async () => {
  try {
    await redis.connect();
    console.log("Redis connected");
  } catch (error) {
    console.error("Redis connection error:", error.message);
    process.exit(1);
  }
};

const disconnectRedis = async () => {
  await redis.quit();
  console.log("Redis disconnected");
};

module.exports = { redis, connectRedis, disconnectRedis };
