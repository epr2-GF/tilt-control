import { Router } from "express";
import { homeAssistantService } from "../services/homeAssistantService";
import { timeAccessMiddleware } from "../middleware/timeAccessMiddleware";
import { locationMiddleware } from "../middleware/locationMiddleware";

import {
  registerStreamClient,
  getCurrentStates,
  refreshHAStates,
} from "../services/haStreamService";

import {
  getDevices,
  getDeviceById,
} from "../services/deviceService";

import { writeAudit } from "../services/auditService";

const router = Router();

/**
 * GET /devices
 *
 * Returns all configured devices.
 */
router.get("/", (req, res) => {
  res.json(getDevices());
});

/**
 * POST /devices/trigger
 *
 * Triggers a device action through Home Assistant.
 *
 * Normal devices:
 *   entityId + requested action are used.
 *
 * ON/OFF devices:
 *   "on"  -> button1Entity
 *   "off" -> button2Entity
 *
 * The ON/OFF card deliberately does NOT use toggle.
 */
router.post(
  "/trigger",
  timeAccessMiddleware,
  locationMiddleware,
  async (req, res) => {
    const user = (req as any).user;

    if (user.timeAccessAllowed === false) {
      return res.status(403).json({
        code: "OUTSIDE_TIME_WINDOW",
        message: "En dehors des horaires autorisés",
      });
    }

    try {
      const { deviceId, action } = req.body;

      const savedDevice = getDeviceById(
        Number(deviceId)
      );

      if (!savedDevice) {
        return res.status(404).json({
          error: "Device not found",
        });
      }

      if (savedDevice.enabled === false) {
        return res.status(403).json({
          code: "DEVICE_DISABLED",
          message: "Cet appareil est désactivé",
        });
      }

      /*
       * ---------------------------------------------------------
       * DETERMINE ENTITY + SERVICE
       * ---------------------------------------------------------
       */

      let entityId = savedDevice.entityId;
      let haService = action;

      /*
       * ON / OFF CARD
       *
       * Green button:
       *   action = "on"
       *   -> button1Entity
       *
       * Red button:
       *   action = "off"
       *   -> button2Entity
       */
      if (savedDevice.cardType === "onOff") {
        if (action === "on") {
          if (!savedDevice.button1Entity) {
            return res.status(400).json({
              code: "ON_ENTITY_NOT_CONFIGURED",
              message:
                "L'entité du bouton ON n'est pas configurée",
            });
          }

          entityId =
            savedDevice.button1Entity;

          haService = "turn_on";

        } else if (action === "off") {
          if (!savedDevice.button2Entity) {
            return res.status(400).json({
              code: "OFF_ENTITY_NOT_CONFIGURED",
              message:
                "L'entité du bouton OFF n'est pas configurée",
            });
          }

          entityId =
            savedDevice.button2Entity;

          haService = "turn_off";

        } else {
          return res.status(400).json({
            code: "INVALID_ONOFF_ACTION",
            message:
              "Action invalide pour une carte ON/OFF",
          });
        }
      }

      /*
       * ---------------------------------------------------------
       * HOME ASSISTANT DOMAIN
       * ---------------------------------------------------------
       */

      const domain =
        entityId.split(".")[0];

      /*
       * Existing input_boolean behaviour.
       *
       * Normal binary/device cards can use toggle.
       *
       * ON/OFF cards never enter this branch.
       */
      if (
        savedDevice.cardType !== "onOff" &&
        domain === "input_boolean" &&
        action === "toggle"
      ) {
        haService = "toggle";
      }

      /*
       * ---------------------------------------------------------
       * SEND COMMAND TO HOME ASSISTANT
       * ---------------------------------------------------------
       */

      const result =
        await homeAssistantService.triggerService(
          domain,
          haService,
          entityId
        );

      /*
       * ---------------------------------------------------------
       * AUDIT SUCCESS
       * ---------------------------------------------------------
       */

      writeAudit({
        severity: "info",
        event: "DEVICE_CONTROL",
        actor: user.username,
        target: savedDevice.name,

        details: {
          deviceId: savedDevice.id,
          entityId,
          action: haService,
          cardType: savedDevice.cardType,
          result: "success",
        },

        role: user.role,
      });

      return res.json({
        success: true,
        updatedState: result,
      });

    } catch (error: any) {

      /*
       * ---------------------------------------------------------
       * FAILED COMMAND AUDIT
       * ---------------------------------------------------------
       */

      try {
        const {
          deviceId,
          action,
        } = req.body;

        const failedDevice =
          getDeviceById(
            Number(deviceId)
          );

        let failedEntityId =
          failedDevice?.entityId;

        /*
         * Record the actual ON/OFF entity
         * when applicable.
         */
        if (
          failedDevice?.cardType === "onOff"
        ) {
          if (action === "on") {
            failedEntityId =
              failedDevice.button1Entity;
          }

          if (action === "off") {
            failedEntityId =
              failedDevice.button2Entity;
          }
        }

        writeAudit({
          severity: "warning",
          event: "DEVICE_CONTROL_FAILED",

          actor: user?.username,

          target:
            failedDevice?.name ||
            String(deviceId),

          details: {
            deviceId,
            entityId: failedEntityId,
            action,
            cardType:
              failedDevice?.cardType,
            result: "failed",
            error:
              error?.message ||
              "Failed to execute HA service",
          },

          role: user?.role,
        });

      } catch (auditError) {
        console.error(
          "Failed writing device audit log",
          auditError
        );
      }

      const message =
        error?.message ||
        "Failed to execute HA service";

      /*
       * Home Assistant entity does not exist.
       */
      if (
        message.includes(
          "HA entity not found"
        ) ||
        message.includes(
          "HTTP 404"
        )
      ) {
        return res.status(404).json({
          code: "HA_ENTITY_NOT_FOUND",
          message:
            "Appareil introuvable dans Home Assistant",
        });
      }

      /*
       * Home Assistant rejected the command.
       */
      return res.status(502).json({
        code: "HA_COMMAND_FAILED",
        message:
          "Home Assistant n'a pas accepté la commande",
      });
    }
  }
);

/**
 * GET /devices/state
 *
 * Requests a fresh state update from Home Assistant
 * and returns the cached states.
 */
router.get(
  "/state",
  async (req, res) => {
    try {
      refreshHAStates();

      await new Promise(
        resolve =>
          setTimeout(resolve, 500)
      );

      res.json(
        getCurrentStates()
      );

    } catch (error) {
      console.error(
        "Failed refreshing HA states",
        error
      );

      res.json(
        getCurrentStates()
      );
    }
  }
);

/**
 * GET /devices/stream
 *
 * Establishes an SSE connection between
 * the browser and backend for real-time
 * Home Assistant updates.
 */
router.get(
  "/stream",
  (req, res) => {

    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );

    res.flushHeaders();

    res.write(
      ": connected\n\n"
    );

    registerStreamClient(res);
  }
);

export default router;