import cors from "cors";
import express from "express";
import type { Application, Request, Response } from "express";
import { errorHandler } from "../middleware/error-handler.js";
import { requestLogger } from "../middleware/request-logger.js";
import type { AppContext } from "./context.js";
import { registerAppRoutes } from "./routes.js";

export const createApp = (context: AppContext): Application => {
  const app = express();

  // Request logging middleware (before all routes)
  app.use(requestLogger);

  // Body parsing and CORS
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: Date.now(),
      modules: [],
    });
  });

  // Register application routes
  registerAppRoutes(app, context);

  // Global error handler (must be after all routes)
  app.use(errorHandler);

  return app;
};
