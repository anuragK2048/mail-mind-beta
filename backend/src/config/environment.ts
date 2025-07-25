import dotenv from "dotenv";
import { z } from "zod";
import path from "path";
dotenv.config();
// Debug: Check current working directory and NODE_ENV
// console.log("🔍 Current working directory:", process.cwd());
// console.log("🔍 NODE_ENV:", process.env.NODE_ENV);
// console.log("🔍 .env file should be at:", path.join(process.cwd(), ".env"));

// Load .env file only in non-production environments
if (process.env.NODE_ENV !== "production") {
  const result = dotenv.config();

  // Debug: Check if .env was loaded successfully
  // if (result.error) {
  //   console.error("❌ Error loading .env file:", result.error);
  // } else {
  //   console.log("✅ .env file loaded successfully");
  //   console.log("🔍 Loaded variables:", Object.keys(result.parsed || {}));
  // }
} else {
  console.log("⚠️  Skipping .env loading (NODE_ENV is production)");
}

// Debug: Check specific environment variables before validation
// console.log("🔍 Raw environment variables:");
// console.log(
//   "  SESSION_SECRET:",
//   process.env.SESSION_SECRET ? "SET" : "NOT SET"
// );
// console.log("  FRONTEND_URL:", process.env.FRONTEND_URL ? "SET" : "NOT SET");
// console.log(
//   "  GOOGLE_CLIENT_ID:",
//   process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET"
// );
// console.log(
//   "  GOOGLE_CLIENT_SECRET:",
//   process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET"
// );
// console.log(
//   "  GOOGLE_CALLBACK_URI:",
//   process.env.GOOGLE_CALLBACK_URI ? "SET" : "NOT SET"
// );

// Define a schema for environment variables using Zod
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("5000")
    .transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) throw new Error("PORT must be a valid number");
      return num;
    }),
  SESSION_SECRET: z
    .string()
    .min(32, "Session secret must be at least 32 characters long"),
  REDIS_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url("Frontend URL must be a valid URL"),
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  GOOGLE_CALLBACK_URI: z
    .string()
    .url("Google Callback URI must be a valid URL"),
  DATABASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GOOGLE_PUB_SUB_TOPIC_NAME: z.string().min(1).optional(),
});

// Validate environment variables
let validatedEnv;
try {
  validatedEnv = envSchema.parse(process.env);
  console.log("✅ Environment variables validated successfully");
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("🔥 Invalid environment variables:");
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join(".")}: ${err.message}`);
    });
  } else {
    console.error("🔥 Environment validation error:", error);
  }
  process.exit(1);
}

export const {
  NODE_ENV,
  PORT,
  SESSION_SECRET,
  REDIS_URL,
  FRONTEND_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URI,
  DATABASE_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  GOOGLE_PUB_SUB_TOPIC_NAME,
} = validatedEnv;

export const CORS_ORIGINS =
  NODE_ENV === "production"
    ? [FRONTEND_URL, "http://localhost:5173"]
    : [FRONTEND_URL, "http://localhost:5173", "http://192.168.29.156:5173"];
