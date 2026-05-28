import type { Request, Response, NextFunction } from "express";

import { getUserById, verifyToken } from "../services/auth.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    const user = await getUserById(payload.sub);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      req.userId = payload.sub;
    } catch {
      // ignore
    }
  }
  next();
}
