import { Request, Response } from "express";
import { readUsers } from "../data/usersStore";
import { ROLE_PERMISSIONS } from "../config/rolePermissions";

/**
 * GET /auth/me
 */
export function getMe(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const users = readUsers();
    const fullUser = users.find(u => u.id === user.id);

    if (!fullUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const permissions =
      ROLE_PERMISSIONS[fullUser.role as keyof typeof ROLE_PERMISSIONS];

    return res.json({
      id: fullUser.id,
      username: fullUser.username,
      role: fullUser.role,
      disabled: fullUser.disabled,
      accessStart: fullUser.accessStart,
      accessEnd: fullUser.accessEnd,
      remoteAccess: fullUser.remoteAccess,

      permissions: {
        zones: permissions?.zones || [],
        controls: permissions?.controls || [],
      },
    });

  } catch (err) {
    console.error("GET /auth/me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}