import express from "express";
import jwt from "jsonwebtoken";
import { readUsers } from "../data/usersStore";
import { JWT_SECRET } from "../config/jwt";
import { authMiddleware } from "../middleware/authMiddleware";
import { ROLE_PERMISSIONS } from "../config/rolePermissions";
import { writeAudit } from "../services/auditService";

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

writeAudit({
  severity: "warning",
  event: "LOGIN_FAILED",
  actor: username,
  ip: req.ip,
});

  return res.status(401).json({
      message: "Identifiants invalides",
    });
  }

if (user.disabled) {

  writeAudit({
    severity: "warning",
    event: "LOGIN_DISABLED_ACCOUNT",
    actor: username,
    ip: req.ip,
  });

  return res.status(403).json({
    message: "Compte désactivé",
  });
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

writeAudit({
  severity: "info",
  event: "LOGIN_SUCCESS",
  actor: user.username,
  role: user.role,
  ip: req.ip,
});

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

  const users = readUsers();
  const currentUser = (req as any).user;

  const user = users.find(u => u.id === currentUser.id);

  if (!user) {
    return res.status(404).json({ 
      message: "Utilisateur introuvable" 
    });
  }

  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    disabled: user.disabled,
    accessStart: user.accessStart,
    accessEnd: user.accessEnd,
    remoteAccess: user.remoteAccess,

    permissions:
      ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS]
  });
});

export default router;