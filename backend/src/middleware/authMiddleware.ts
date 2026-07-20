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
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }

    if (currentUser.disabled) {
      return res.status(403).json({ message: "Compte désactivé" });
    }

    (req as any).user = {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
      remoteAccess: currentUser.remoteAccess,
      accessStart: currentUser.accessStart,
      accessEnd: currentUser.accessEnd,
    };

    next();
  } catch (err) {
    console.log("JWT ERROR:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}