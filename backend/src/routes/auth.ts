import express from "express";
import jwt from "jsonwebtoken";
import { readUsers } from "../data/usersStore";
import { JWT_SECRET } from "../config/jwt";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

/* -----------------------------
   LOGIN
----------------------------- */
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const users = readUsers();

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Identifiants invalides",
    });
  }

  if (user.disabled) {
    return res.status(403).json({
      message: "Compte désactivé",
    });
  }

  // 🕒 TIME CHECK (ONLY HERE)
  if (user.accessStart && user.accessEnd) {
    const now = new Date();

    const [sh, sm] = user.accessStart.split(":").map(Number);
    const [eh, em] = user.accessEnd.split(":").map(Number);

    const start = new Date();
    start.setHours(sh, sm, 0, 0);

    const end = new Date();
    end.setHours(eh, em, 59, 999);

    if (now < start || now > end) {
      return res.status(403).json({
        message: "En dehors des horaires autorisés",
      });
    }
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    token,
  });
});

router.get("/me", authMiddleware, (req, res) => {
  console.log("AUTH HEADER:", req.headers.authorization);
  
    const users = readUsers();
  const currentUser = (req as any).user;

  const user = users.find(u => u.id === currentUser.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    disabled: user.disabled,
    accessStart: user.accessStart,
    accessEnd: user.accessEnd
  });
});

export default router;