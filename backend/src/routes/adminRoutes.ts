
import express from "express";
import fs from "fs";
import path from "path";

import { authMiddleware } from "../middleware/authMiddleware";
import {
  readSiteMessage,
  saveSiteMessage,
} from "../data/siteMessageStore";
import {
  getAllDeviceStatusLogs,
} from "../services/deviceStatusLogService";

const router = express.Router();

const LOG_FILE = path.join(
  __dirname,
  "../data/auditLog.json"
);

function isGhostAdmin(user: any): boolean {
  return (
    String(user?.id) === "0" &&
    user?.username === "GhostAdmin"
  );
}

function canManageUsers(user: any): boolean {
  return user?.capabilities?.manageUsers === true;
}

/* =========================================================
   GET /admin/audit
   Admin and GhostAdmin only
   ========================================================= */

router.get("/audit", authMiddleware, (req, res) => {
  const user = (req as any).user;

  if (!isGhostAdmin(user) && !canManageUsers(user)) {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  if (!fs.existsSync(LOG_FILE)) {
    return res.json([]);
  }

  try {
    const logs = JSON.parse(
      fs.readFileSync(LOG_FILE, "utf8")
    );

    if (!Array.isArray(logs)) {
      return res.status(500).json({
        message: "Invalid audit log format",
      });
    }

    return res.json([...logs].reverse());
  } catch (error) {
    console.error("Failed to read audit log", error);

    return res.status(500).json({
      message: "Failed to read audit log",
    });
  }
});

/* =========================================================
   GET /admin/device-status-log
   GhostAdmin only
   ========================================================= */

router.get(
  "/device-status-log",
  authMiddleware,
  (req, res) => {
    const user = (req as any).user;

    if (!isGhostAdmin(user)) {
      return res.status(403).json({
        message: "GhostAdmin access required",
      });
    }

    try {
      const logs = getAllDeviceStatusLogs();
      return res.json(logs);
    } catch (error) {
      console.error(
        "Failed to read device status log",
        error
      );

      return res.status(500).json({
        message: "Failed to read device status log",
      });
    }
  }
);

/* =========================================================
   DELETE /admin/audit
   GhostAdmin only
   ========================================================= */

router.delete("/audit", authMiddleware, (req, res) => {
  const user = (req as any).user;

  if (!isGhostAdmin(user)) {
    return res.status(403).json({
      message: "GhostAdmin access required",
    });
  }

  try {
    fs.writeFileSync(LOG_FILE, "[]", "utf8");

    return res.json({
      success: true,
      message: "Journal effacé",
    });
  } catch (error) {
    console.error("Failed to clear audit log", error);

    return res.status(500).json({
      message: "Failed to clear audit log",
    });
  }
});

/* =========================================================
   GET /admin/site-message
   All authenticated users can read the message.
   Only GhostAdmin receives updatedAt and updatedBy.
   ========================================================= */

router.get(
  "/site-message",
  authMiddleware,
  (req, res) => {
    const user = (req as any).user;

    try {
      const saved = readSiteMessage();

      if (isGhostAdmin(user)) {
        return res.json(saved);
      }

      return res.json({
        message: saved.message || "",
      });
    } catch (error) {
      console.error(
        "Failed to read site message",
        error
      );

      return res.status(500).json({
        message: "Failed to read site message",
      });
    }
  }
);

/* =========================================================
   PUT /admin/site-message
   Admin and GhostAdmin can edit the message.
   ========================================================= */

router.put(
  "/site-message",
  authMiddleware,
  (req, res) => {
    const user = (req as any).user;

    if (!isGhostAdmin(user) && !canManageUsers(user)) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const { message } = req.body;

    if (typeof message !== "string") {
      return res.status(400).json({
        message: "Message must be a string",
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        message: "Message must not exceed 5000 characters",
      });
    }

    try {
      const saved = saveSiteMessage(
        message,
        user.username
      );

      if (isGhostAdmin(user)) {
        return res.json(saved);
      }

      return res.json({
        message: saved.message || "",
      });
    } catch (error) {
      console.error(
        "Failed to save site message",
        error
      );

      return res.status(500).json({
        message: "Failed to save site message",
      });
    }
  }
);

export default router;
