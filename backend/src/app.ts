import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import helmet from "helmet"; //for security header
import morgan from "morgan"; //HTTP request logger
import {
  NODE_ENV,
  SESSION_SECRET,
  FRONTEND_URL,
  connectToRedis,
  CORS_ORIGINS,
} from "./config";
import { redisStore } from "./config";
import apiRoutes from "./api/routes";
// import { globalErrorHandler } from "./middleware/errorHandler";
// import { NotFoundError } from "./utils/errors"; // A custom error class
import { nextTick } from "process";
import { OAuthFlowAction } from "./types/auth.types";
import { UUID } from "crypto";
import errorHandler from "./middleware/errorHandler";

// typescript
declare module "express-session" {
  interface SessionData {
    userId?: UUID;
    oauthFlowContent?: {
      csrfToken: string;
      action: OAuthFlowAction;
    };
    isLoggedIn?: boolean;
  }
}

async function initializeApp() {
  const app: Application = express();

  //Core middleware
  const corsOptions = {
    origin: CORS_ORIGINS,
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.set("trust proxy", 1);

  // Body parsing
  app.use(express.json({ limit: "10kb" })); // Adjust limit as needed
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // HTTP request logging
  if (NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // connect redis
  await connectToRedis();
  if (!redisStore)
    console.error(
      "🔴 Redis store not initialized after connectToRedis. Sessions will fail or use MemoryStore."
    );

  //Session - Middleware
  app.use(
    session({
      store: redisStore,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: NODE_ENV == "development" ? false : true,
        httpOnly: true,
        maxAge: 60 * 60 * 1000 * 3, // 1 hour
        sameSite: NODE_ENV == "development" ? "lax" : "none", // Consider 'strict' if appropriate
      },
    })
  );

  // app.get("/set", (req, res) => {
  //   req.session.userId = "1234";
  //   req.session.save();
  //   res.json({ mes: "succ" });
  // });
  // app.get("/get", (req, res) => {
  //   res.json({ userId: req.session.userId || "Not set" });
  // });

  //API Routes
  app.get("/", (req: Request, res: any) => res.send("API Healthy"));
  app.use("/api/v1", apiRoutes);

  // --- 404 Handler for API routes ---
  // app.all("/api/*", (req: Request, res: Response, next: NextFunction) => {
  //   next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
  // });

  //Global Error Handler Middleware
  app.use(errorHandler);
  return app;
}

export default initializeApp;
