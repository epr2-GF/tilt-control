
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
 * Returns all configured devices.
 */
router.get("/", (req, res) => {
  res.json(getDevices());
});

/**
 * POST /devices/trigger
 *
 * Triggers a device action through the local
 * Home Assistant instance.
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
      const savedDevice = getDeviceById(Number(deviceId));

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

      const device = {
        entityId: savedDevice.entityId,
        domain: savedDevice.entityId.split(".")[0],
      };

      let haService = action;

      if (
        device.domain === "input_boolean" &&
        action === "toggle"
      ) {
        haService = "toggle";
      }

      /*
       * Confirm the entity exists and then send
       * the command to the local Home Assistant.
       *
       * We deliberately do not check the resulting
       * device state because devices may be momentary,
       * contactor controlled or configured with auto-off.
       */
      const result =
        await homeAssistantService.triggerService(
          device.domain,
          haService,
          device.entityId
        );

      /*
       * Successful command = yellow audit entry.
       */
      writeAudit({
        severity: "info",
        event: "DEVICE_CONTROL",
        actor: user.username,
        target: savedDevice.name,
        details: {
          deviceId: savedDevice.id,
          entityId: device.entityId,
          action: haService,
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
       * Record failed device command.
       */
      try {
        const { deviceId, action } = req.body;
        const failedDevice = getDeviceById(Number(deviceId));

        writeAudit({
          severity: "warning",
          event: "DEVICE_CONTROL_FAILED",
          actor: user?.username,
          target:
            failedDevice?.name ||
            String(deviceId),
          details: {
            deviceId,
            entityId: failedDevice?.entityId,
            action,
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
       * Entity does not exist in Home Assistant.
       */
      if (
        message.includes("HA entity not found") ||
        message.includes("HTTP 404")
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
 * Requests a fresh state update from the local
 * Home Assistant instance and returns cached states.
 */
router.get("/state", async (req, res) => {
  try {
    refreshHAStates();

    await new Promise(resolve =>
      setTimeout(resolve, 500)
    );

    res.json(getCurrentStates());
  } catch (error) {
    console.error(
      "Failed refreshing HA states",
      error
    );

    res.json(getCurrentStates());
  }
});

/**
 * GET /devices/stream
 *
 * Establishes an SSE connection between the browser
 * and backend for real-time Home Assistant updates.
 */
router.get("/stream", (req, res) => {
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

  res.write(": connected\n\n");

  registerStreamClient(res);
});

export default router;

