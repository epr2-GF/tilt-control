import express from "express";
import { exec } from "child_process";
import { isHAConnected } from "../services/haStreamService";
import { getActiveSessions } from "../services/sessionService";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/", (req, res) => {

  const currentUser = (req as any).user;

  const uptimeSeconds = process.uptime();

  exec(
    "pm2 jlist",
    (error, stdout) => {

      let pm2Restarts = 0;

      if (!error) {

        try {

          const processes = JSON.parse(stdout);

          const backend = processes.find(
            (p:any) => p.name === "tilt-backend"
          );

          if (backend) {
            pm2Restarts = backend.pm2_env.restart_time;
          }

        } catch(e) {

          console.error(
            "PM2 status parse error",
            e
          );

        }

      }


      let activeUsers = getActiveSessions();


      // Hide superadmin sessions from admin users
      if (currentUser.role !== "superadmin") {

        activeUsers = activeUsers.filter(
          user => user.role !== "superadmin"
        );

      }


      // Only expose safe fields
      activeUsers = activeUsers.map(
        user => ({
          username: user.username,
          role: user.role,
          lastSeen: user.lastSeen,
        })
      );


      res.json({

        backend: "online",

        uptimeSeconds,

        pm2Restarts,

        homeAssistant:
          isHAConnected()
            ? "connected"
            : "disconnected",

        activeUsers

      });

    }
  );

});


export default router;