import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  updateSession,
  endSession,
} from "../services/sessionService";

const router = express.Router();

router.post(
  "/heartbeat",
  authMiddleware,
  (req, res) => {
    const user = (req as any).user;

    if (user) {
      updateSession(
        user.username,
        user.role
      );
    }

    res.json({
      success: true,
    });
  }
);


/*
  LOGOUT
  Explicitly mark the user offline
*/
router.post(
  "/logout",
  authMiddleware,
  (req, res) => {
    const user = (req as any).user;

    if (user) {
      endSession(user.username);
    }

    res.json({
      success: true,
    });
  }
);

export default router;