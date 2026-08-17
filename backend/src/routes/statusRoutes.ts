import express from "express";
import { exec } from "child_process";

import {
  isHAConnected
} from "../services/haStreamService";

import {
  getActiveSessions,
  getRecentSessions,
} from "../services/sessionService";

import {
  authMiddleware
} from "../middleware/authMiddleware";


const router =
  express.Router();


router.use(
  authMiddleware
);



router.get(
  "/",
  (req, res) => {

    const currentUser =
      (req as any).user;


    const uptimeSeconds =
      process.uptime();


    exec(
      "pm2 jlist",
      (error, stdout) => {

        let pm2Restarts = 0;


        if (!error) {

          try {

            const processes =
              JSON.parse(stdout);


            const backend =
              processes.find(
                (p: any) =>
                  p.name ===
                  "tilt-backend"
              );


            if (backend) {

              pm2Restarts =
                backend.pm2_env
                  .restart_time;

            }

          } catch {

            // PM2 information is optional.
            pm2Restarts = 0;

          }

        }


        /*
          -------------------------------------------------------
          USERS ACTIVE DURING LAST 24 HOURS
          -------------------------------------------------------
        */

        let recentUsers =
          getRecentSessions();


        /*
          Normal admins must not see superadmin activity.
        */

        if (
          currentUser.role !==
          "superadmin"
        ) {

          recentUsers =
            recentUsers.filter(
              user =>
                user.role !==
                "superadmin"
            );

        }


        /*
          Determine which users are currently online.
        */

        const activeUsers =
          getActiveSessions();


        const activeUsernames =
          new Set(
            activeUsers.map(
              user =>
                user.username
            )
          );


        /*
          Only expose safe information.
        */

        recentUsers =
          recentUsers.map(
            user => ({

              username:
                user.username,

              role:
                user.role,

              lastSeen:
                user.lastSeen,

              online:
                activeUsernames.has(
                  user.username
                ),

            })
          );


        res.json({

          backend:
            "online",

          uptimeSeconds,

          pm2Restarts,

          homeAssistant:
            isHAConnected()
              ? "connected"
              : "disconnected",

          recentUsers,

        });

      }
    );

  }
);


export default router;