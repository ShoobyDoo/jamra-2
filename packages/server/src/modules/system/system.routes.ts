import { Router } from "express";
import type { AppContext } from "../../app/context.js";
import { shutdownServer } from "../../runtime/server-lifecycle.js";

export const createSystemRouter = (context: AppContext): Router => {
  const router = Router();

  router.post("/shutdown", (_req, res) => {
    context.logger.info("Received shutdown request via internal API");
    res.status(202).json({ status: "shutting-down" });

    void (async () => {
      try {
        await shutdownServer();
      } catch (error) {
        context.logger.error("Failed to complete graceful shutdown", {
          error,
        });
      } finally {
        process.exit(0);
      }
    })();
  });

  return router;
};
