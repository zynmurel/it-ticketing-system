import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { findUserById } from "../services/auth.service";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.sub);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
