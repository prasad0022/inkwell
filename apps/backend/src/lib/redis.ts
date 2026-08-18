import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const createRedisClient = () => {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on("connect", () => {
    console.log("✅ Redis connected");
  });

  client.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  return client;
};

// Create two separate clients — pub/sub requires separate connections
export const pubClient = createRedisClient();
export const subClient = pubClient.duplicate();
