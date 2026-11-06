
import express from "express";
import { exec } from "child_process";

import { isHAConnected } from "../services/haStreamService";

import {
  getActiveSessions,
  getRecentSessions,
} from "../services/sessionService";

import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/", (req, res) => {
  const currentUser = (req as any).user;

  const isGhostAdmin =
    String(currentUser.id) === "0" &&
    currentUser.username === "GhostAdmin";

  const canViewRecentUsers =
    isGhostAdmin ||
    currentUser.capabilities?.manageUsers === true;

  const uptimeSeconds = process.uptime();

  exec("pm2 jlist", (error, stdout) => {
    let pm2Restarts = 0;

    if (!error) {
      try {
        const processes = JSON.parse(stdout);

        const backend = processes.find(
          (p: any) => p.name === "tilt-backend"
        );

        if (backend) {
          pm2Restarts = backend.pm2_env.restart_time;
        }
      } catch {
        // PM2 information is optional.
        pm2Restarts = 0;
      }
    }

    let recentUsers: {
      username: string;
      lastSeen: number;
      online: boolean;
    }[] = [];

    if (canViewRecentUsers) {
      const sessions = getRecentSessions().filter(
  user => isGhostAdmin || user.username !== "GhostAdmin"
);

      const activeUsernames = new Set(
        getActiveSessions().map(user => user.username)
      );

      recentUsers = sessions.map(user => ({
        username: user.username,
        lastSeen: user.lastSeen,
        online: activeUsernames.has(user.username),
      }));
    }

    return res.json({
      backend: "online",
      uptimeSeconds,
      pm2Restarts,
      homeAssistant: isHAConnected()
        ? "connected"
        : "disconnected",
      recentUsers,
    });
  });
});

export default router;
