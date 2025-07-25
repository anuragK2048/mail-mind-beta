// src/jobs/queue.setup.ts
import { Queue, QueueOptions } from "bullmq"; // Import QueueOptions
import { REDIS_URL } from "../config";

// Let TypeScript infer the connection type from QueueOptions
const queueOptions: QueueOptions = {
  connection: REDIS_URL
    ? {
        host: new URL(REDIS_URL).hostname,
        port: Number(new URL(REDIS_URL).port),
        password: new URL(REDIS_URL).password,
      }
    : {
        host: "localhost",
        port: 6379,
      },
};

// Create the queue using the fully typed options object
export const gmailSyncQueue = new Queue("gmail-sync", queueOptions);
