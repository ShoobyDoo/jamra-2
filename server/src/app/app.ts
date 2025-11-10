import cors from "cors";
import express from "express";
import type { Application, Request, Response } from "express";
import { registerAppRoutes } from "./routes.js";
import type { AppContext } from "./context.js";

export const createApp = (context: AppContext): Application => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  registerAppRoutes(app, context);

  app.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: Date.now(),
      modules: [],
    });
  });

  return app;
};
