
import { Request, Response } from "express";
import { readUsers } from "../data/usersStore";

/**
 * GET /auth/me
 *
 * Returns the current user's explicit zones and capabilities.
 * Authentication is handled by authMiddleware.
 */
export function getMe(req: Request, res: Response) {
  try {
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const users = readUsers();

    const fullUser = users.find(
      user => String(user.id) === String(authenticatedUser.id)
    );

    if (!fullUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (fullUser.disabled) {
      return res.status(403).json({
        message: "Account disabled",
      });
    }

    return res.json({
      id: fullUser.id,
      username: fullUser.username,
      zones: Array.isArray(fullUser.zones)
        ? fullUser.zones
        : [],
      capabilities: fullUser.capabilities ?? {},
      disabled: Boolean(fullUser.disabled),
      accessStart: fullUser.accessStart,
      accessEnd: fullUser.accessEnd,
      remoteAccess: fullUser.remoteAccess,
    });
  } catch (err) {
    console.error("GET /auth/me error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
}
