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
    const queryToken = req.query.token as string; // 👈 Extract token from URL query string fallback
    
    let token = null;

    // 1. Extract token from either the Authorization header OR the URL query parameter
    if (authHeader) {
      token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;
    } else if (queryToken) {
      token = queryToken;
    }

    // 2. Fail early if no token was provided in either location
    if (!token) {
      return res.status(401).json({ message: "No token provided or invalid format" });
    }

    // 3. Verify the signature
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // ✅ USE SINGLE SOURCE OF TRUTH
    const users = readUsers();
    const currentUser = users.find((u) => u.id === decoded.id);

    if (!currentUser) {
      return res.status(401).json({ message: "User not found" });
    }

    // 🚫 BLOCK DISABLED USERS
    if (currentUser.disabled) {
      return res.status(403).json({ message: "Account disabled" });
    }

    // Attach user context downstream
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