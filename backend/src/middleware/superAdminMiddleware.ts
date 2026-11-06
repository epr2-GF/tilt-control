
import { Request, Response, NextFunction } from "express";

export function superAdminOnly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;

  // The auth middleware reloads this identity from users.json.
  // Require both values so an ordinary account cannot gain
  // GhostAdmin access by changing a client-supplied field.
  const isGhostAdmin =
    user?.id === "0" &&
    user?.username === "GhostAdmin";

  if (!isGhostAdmin) {
    return res.status(403).json({
      message: "GhostAdmin access required",
    });
  }

  return next();
}
