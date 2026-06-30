import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../config/jwt";
import { readUsers } from "../data/usersStore";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string;

    let token = null;

    if (authHeader) {
      token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided or invalid format" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const users = readUsers();
    const currentUser = users.find((u) => u.id === decoded.id);

    if (!currentUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (currentUser.disabled) {
      return res.status(403).json({ message: "Account disabled" });
    }

    // 🕒 TIME CHECK (NEW)
    if (currentUser.accessStart && currentUser.accessEnd) {
      const now = new Date();

      const [sh, sm] = currentUser.accessStart.split(":").map(Number);
      const [eh, em] = currentUser.accessEnd.split(":").map(Number);

      const start = new Date();
      start.setHours(sh, sm, 0, 0);

      const end = new Date();
      end.setHours(eh, em, 59, 999);

      if (now < start || now > end) {
        return res.status(403).json({
          message: "Outside permitted hours",
        });
      }
    }

    (req as any).user = {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
    };

    next();
  } catch (err) {
    console.log("JWT ERROR:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}