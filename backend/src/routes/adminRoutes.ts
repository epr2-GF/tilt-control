import express from "express";
import fs from "fs";
import path from "path";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();


const LOG_FILE =
  path.join(__dirname, "../data/auditlog.json");


// GET /admin/audit
router.get(
  "/audit",
  authMiddleware,
  (req, res) => {

    const user = (req as any).user;


    // Admin only
    if (user.role !== "admin") {

      return res.status(403).json({
        message: "Admin access required"
      });

    }


    if (!fs.existsSync(LOG_FILE)) {

      return res.json([]);

    }


    const logs = JSON.parse(
      fs.readFileSync(LOG_FILE, "utf8")
    );


    // newest first
    logs.reverse();


    return res.json(logs);

  }
);


export default router;