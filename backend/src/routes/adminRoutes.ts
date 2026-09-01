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


const LOG_FILE =
  path.join(__dirname, "../data/auditLog.json");



/* =========================================================
   GET /admin/audit
   ========================================================= */

router.get(
  "/audit",
  authMiddleware,
  (req, res) => {

    const user = (req as any).user;


    // Admin and superadmin only
    if (
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {

      return res.status(403).json({
        message: "Admin access required",
      });

    }


    if (!fs.existsSync(LOG_FILE)) {

      return res.json([]);

    }


    try {

      const logs = JSON.parse(
        fs.readFileSync(
          LOG_FILE,
          "utf8"
        )
      );


      // Newest first
      logs.reverse();


      return res.json(logs);

    } catch (error) {

      console.error(
        "Failed to read audit log",
        error
      );


      return res.status(500).json({
        message: "Failed to read audit log",
      });

    }

  }
);

/* =========================================================
   GET /admin/device-status-log
   ========================================================= */

router.get(
  "/device-status-log",
  authMiddleware,
  (req, res) => {

    const user = (req as any).user;

    // Superadmin only
    if (user.role !== "superadmin") {

      return res.status(403).json({
        message: "Superadmin access required",
      });

    }

    try {

      const logs =
        getAllDeviceStatusLogs();

      return res.json(logs);

    } catch (error) {

      console.error(
        "Failed to read device status log",
        error
      );

      return res.status(500).json({
        message:
          "Failed to read device status log",
      });

    }

  }
);

/* =========================================================
   DELETE /admin/audit
   ========================================================= */

router.delete(
  "/audit",
  authMiddleware,
  (req, res) => {

    const user = (req as any).user;

    // Superadmin only
    if (user.role !== "superadmin") {
      return res.status(403).json({
        message: "Superadmin access required",
      });
    }

    try {

      // Clear the audit log
      fs.writeFileSync(
        LOG_FILE,
        "[]",
        "utf8"
      );

      return res.json({
        success: true,
        message: "Journal effacé",
      });

    } catch (error) {

      console.error(
        "Failed to clear audit log",
        error
      );

      return res.status(500).json({
        message: "Failed to clear audit log",
      });

    }
  }
);

/* =========================================================
   GET /admin/site-message
   =========================================================

   All authenticated users can read the message.

   IMPORTANT:
   Only superadmin receives:
     - updatedAt
     - updatedBy

   Normal admins receive ONLY:
     - message

   This protects the information at API level, not just
   by hiding it in the frontend.
   ========================================================= */

router.get(
  "/site-message",
  authMiddleware,
  (req, res) => {

    const user = (req as any).user;


    try {

      const saved = readSiteMessage();


      // Superadmin can see the complete information
      if (user.role === "superadmin") {

        return res.json(saved);

      }


      // Normal admin / other authenticated users
      // only receive the actual message.
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
   =========================================================

   Admin and superadmin can edit the message.
   ========================================================= */

router.put(
  "/site-message",
  authMiddleware,
  (req, res) => {

    const user = (req as any).user;


    // Admin and superadmin only
    if (
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {

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


    try {

      const saved = saveSiteMessage(
        message,
        user.username
      );


      /*
        Return the complete result to superadmin.

        Normal admin doesn't need the audit information,
        so don't send it back to them.
      */

      if (user.role === "superadmin") {

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