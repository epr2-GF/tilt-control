
import express from "express";
import jwt from "jsonwebtoken";
import { readUsers } from "../data/usersStore";
import { JWT_SECRET } from "../config/jwt";
import { authMiddleware } from "../middleware/authMiddleware";
import { writeAudit } from "../services/auditService";

const router = express.Router();

function safeUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    zones: Array.isArray(user.zones) ? user.zones : [],
    capabilities: user.capabilities ?? {},
    disabled: Boolean(user.disabled),
    accessStart: user.accessStart,
    accessEnd: user.accessEnd,
    remoteAccess: user.remoteAccess,
  };
}

/* -----------------------------
   LOGIN
----------------------------- */
router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};

  if (
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Nom d'utilisateur et mot de passe requis",
    });
  }

  const users = readUsers();

  const user = users.find(
    (candidate) =>
      candidate.username.toLowerCase() === username.trim().toLowerCase() &&
      candidate.password === password
  );

  if (!user) {
    writeAudit({
      severity: "warning",
      event: "LOGIN_FAILED",
      actor: username,
    });

    return res.status(401).json({
      message: "Identifiants invalides",
    });
  }

  if (user.disabled) {
    writeAudit({
      severity: "warning",
      event: "LOGIN_DISABLED_ACCOUNT",
      actor: user.username,
    });

    return res.status(403).json({
      message: "Compte désactivé",
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  writeAudit({
    severity: "info",
    event: user.id === "0" && user.username === "GhostAdmin"
      ? "SUPERADMIN_LOGIN"
      : "LOGIN_SUCCESS",
    actor: user.username,
  });

  return res.json({
    user: safeUser(user),
    token,
  });
});

/* -----------------------------
   LOGOUT
----------------------------- */
router.post("/logout", authMiddleware, (req, res) => {
  const user = (req as any).user;

  if (user) {
    writeAudit({
      severity: "info",
      event: "LOGOUT",
      actor: user.username,
    });
  }

  return res.json({
    success: true,
  });
});

/* -----------------------------
   CURRENT USER
----------------------------- */
router.get("/me", authMiddleware, (req, res) => {
  const users = readUsers();
  const currentUser = (req as any).user;

  const user = users.find(
    (candidate) =>
      String(candidate.id) === String(currentUser.id)
  );

  if (!user) {
    return res.status(404).json({
      message: "Utilisateur introuvable",
    });
  }

  if (user.disabled) {
    return res.status(403).json({
      message: "Compte désactivé",
    });
  }

  return res.json(safeUser(user));
});

export default router;
