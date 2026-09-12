import type { RequestHandler } from "express";

const buckets = new Map<string, { count: number; resetAt: number }>();

export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
};

export const writeRateLimit: RequestHandler = (req, res, next) => {
  if (req.method === "GET" || req.path === "/healthz") return next();
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  current.count += 1;
  if (current.count > 60) {
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many write requests. Try again shortly.",
        details: {},
        requestId: res.locals.requestId,
      },
    });
    return;
  }
  next();
};