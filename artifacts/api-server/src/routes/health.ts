import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";
import { redisCoordinator } from "../infra/redis";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  let databaseHealthy = false;
  try {
    await pool.query("select 1");
    databaseHealthy = true;
  } catch {
    databaseHealthy = false;
  }

  let redisHealthy = false;
  if (redisCoordinator.configured) {
    try {
      redisHealthy = await redisCoordinator.ping();
    } catch {
      redisHealthy = false;
    }
  }

  const status = databaseHealthy ? "ok" : "degraded";
  const data = HealthCheckResponse.parse({
    status,
    service: "gridtrade-api",
    timestamp: new Date(),
  });
  res.status(status === "ok" ? 200 : 503).json({
    ...data,
    dependencies: {
      postgres: databaseHealthy ? "ok" : "unavailable",
      redis: redisCoordinator.configured
        ? redisHealthy
          ? "ok"
          : "unavailable"
        : "not_configured",
    },
  });
});

export default router;
