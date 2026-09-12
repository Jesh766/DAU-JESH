import type { RequestHandler } from "express";

export type PlatformRole =
  | "PROSUMER"
  | "CONSUMER"
  | "UTILITY"
  | "REGULATOR"
  | "ADMIN";

export interface AuthContext {
  userId: string;
  displayName: string;
  role: PlatformRole;
}

declare global {
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}

const demoContext: AuthContext = {
  userId: "8f6a2b30-1d0c-4d74-8d68-3b7d2b09c2a1",
  displayName: "Aarav Mehta",
  role: "PROSUMER",
};

export const attachAuthContext: RequestHandler = (req, _res, next) => {
  // Clerk is the production auth boundary. The demo context makes the foundation
  // usable before the managed Clerk tenant is configured.
  req.authContext = demoContext;
  next();
};

export function requireRole(...roles: PlatformRole[]): RequestHandler {
  return (req, res, next) => {
    if (!req.authContext || !roles.includes(req.authContext.role)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action.",
          details: {},
          requestId: res.locals.requestId,
        },
      });
      return;
    }
    next();
  };
}