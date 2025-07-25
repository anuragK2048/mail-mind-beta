import { createClient, RedisClientType } from "redis";
import { RedisStore } from "connect-redis";
import { REDIS_URL, NODE_ENV } from "./environment";

let redisClient: RedisClientType;
let redisStore: any;

const initializeRedis = async () => {
  if (!REDIS_URL && NODE_ENV !== "test") {
    console.warn("REDIS_URL not defined, Session will use memory store");
    return;
  }
  console.log(REDIS_URL);
  if (REDIS_URL) {
    redisClient = createClient({
      url: REDIS_URL,
    });
    redisClient.on("error", (err) =>
      console.error("Reddis client error: ", err)
    );
    redisClient.on("connect", () =>
      console.log("Successfully connected to redis for Session Store")
    );

    // Creating instance of redis store
    try {
      await redisClient.connect(); // Connect the client
      redisStore = new RedisStore({
        client: redisClient,
        prefix: "app:sess:",
      });
      console.log("Redis Store configured");
    } catch (err) {
      console.error("Failed to initialize Redis store:", err);
    }
  }
};

export const connectToRedis = initializeRedis;
export { redisClient, redisStore };
