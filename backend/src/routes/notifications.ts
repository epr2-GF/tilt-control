
import express from "express";
import crypto from "crypto";
import type { PushSubscription } from "web-push";

import { authMiddleware } from "../middleware/authMiddleware";

import {
  getVapidPublicKey,
  getHomeAssistantSecret,
  getPushSubscriptions,
  savePushSubscription,
  removePushSubscription,
} from "../data/pushStore";

import {
  sendPushToAll,
  type PushNotification,
} from "../services/pushService";

const router = express.Router();

/* =========================================================
   GET VAPID PUBLIC KEY
   Authenticated users only
   ========================================================= */

router.get("/vapid-public-key", authMiddleware, (_req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");

    return res.json({
      publicKey: getVapidPublicKey(),
    });
  } catch (error) {
    console.error("Unable to retrieve VAPID public key:", error);

    return res.status(500).json({
      message: "Unable to retrieve notification configuration",
    });
  }
});

/* =========================================================
   REGISTER BROWSER SUBSCRIPTION
   Authenticated users only
   ========================================================= */

router.post("/subscribe", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const subscription = req.body?.subscription as
    | PushSubscription
    | undefined;

  if (
    !subscription ||
    typeof subscription.endpoint !== "string" ||
    !subscription.endpoint.startsWith("https://") ||
    !subscription.keys ||
    typeof subscription.keys.p256dh !== "string" ||
    typeof subscription.keys.auth !== "string"
  ) {
    return res.status(400).json({
      message: "Invalid browser subscription",
    });
  }

  try {
    savePushSubscription(String(user.id), subscription);

    return res.json({
      success: true,
      message: "Device registered for notifications",
    });
  } catch (error) {
    console.error("Unable to save push subscription:", error);

    return res.status(500).json({
      message: "Unable to register this device",
    });
  }
});

/* =========================================================
   REMOVE BROWSER SUBSCRIPTION
   Authenticated users can remove only their own devices
   ========================================================= */

router.delete("/subscribe", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const endpoint = req.body?.endpoint;

  if (
    typeof endpoint !== "string" ||
    !endpoint.startsWith("https://")
  ) {
    return res.status(400).json({
      message: "Invalid subscription endpoint",
    });
  }

  const subscriptions = getPushSubscriptions();

  const ownedSubscription = subscriptions.find(
    (record) =>
      record.userId === String(user.id) &&
      record.subscription.endpoint === endpoint
  );

  if (!ownedSubscription) {
    return res.status(404).json({
      message: "Subscription not found",
    });
  }

  try {
    removePushSubscription(endpoint);

    return res.json({
      success: true,
      message: "Device removed from notifications",
    });
  } catch (error) {
    console.error("Unable to remove push subscription:", error);

    return res.status(500).json({
      message: "Unable to remove this device",
    });
  }
});

/* =========================================================
   HOME ASSISTANT NOTIFICATION
   Authenticated using a dedicated shared secret
   ========================================================= */

router.post("/send", async (req, res) => {
  const suppliedSecret = req.headers[
    "x-tilt44-notification-secret"
  ];

  if (
    typeof suppliedSecret !== "string" ||
    suppliedSecret.length === 0
  ) {
    return res.status(401).json({
      message: "Invalid notification credentials",
    });
  }

  try {
    const expectedSecret = getHomeAssistantSecret();

    const suppliedBuffer = Buffer.from(suppliedSecret);
    const expectedBuffer = Buffer.from(expectedSecret);

    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return res.status(401).json({
        message: "Invalid notification credentials",
      });
    }

    const { title, body, url } = req.body ?? {};

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.length > 120 ||
      typeof body !== "string" ||
      !body.trim() ||
      body.length > 1000
    ) {
      return res.status(400).json({
        message: "Invalid notification title or body",
      });
    }

    if (
      url !== undefined &&
      (
        typeof url !== "string" ||
        !url.startsWith("/") ||
        url.startsWith("//")
      )
    ) {
      return res.status(400).json({
        message: "Invalid notification URL",
      });
    }

    const notification: PushNotification = {
      title: title.trim(),
      body: body.trim(),
      url: url ?? "/",
    };

    const result = await sendPushToAll(notification);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Home Assistant notification failed:", error);

    return res.status(500).json({
      message: "Unable to send notification",
    });
  }
});

/* =========================================================
   GET HOME ASSISTANT SECRET
   GhostAdmin only
   ========================================================= */

router.get(
  "/home-assistant-secret",
  authMiddleware,
  (req, res) => {
    const user = (req as any).user;

    if (
      String(user?.id) !== "0" ||
      user?.username !== "GhostAdmin"
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");

      return res.json({
        secret: getHomeAssistantSecret(),
      });
    } catch (error) {
      console.error("Unable to retrieve notification secret:", error);

      return res.status(500).json({
        message: "Unable to retrieve notification configuration",
      });
    }
  }
);

export default router;
