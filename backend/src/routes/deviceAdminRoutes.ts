import express from "express";
import {
  reloadDeviceEntities,
  refreshCurrentStates,
} from "../services/haStreamService";
import { writeAudit } from "../services/auditService";
import { authMiddleware } from "../middleware/authMiddleware";
import { superAdminOnly } from "../middleware/superAdminMiddleware";
import {
  getDevices,
  getDeviceById,
  addDevice,
  updateDevice,
  deleteDevice,
} from "../services/deviceService";

const router = express.Router();


function isDeviceValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return [
    "Device name",
    "Invalid device description",
    "Invalid Home Assistant entity ID",
    "Invalid device zones",
    "Invalid device card type",
    "Device enabled",
    "Invalid device sort order",
    "Invalid device icon",
    "Invalid device statusTrue",
    "Invalid device statusFalse",
    "Invalid MiniLog mode",
    "Invalid MiniLog pulse duration",
    "Device is missing required fields",
    "Run Script devices must use a script entity",
    "OnOff devices require valid button1Entity and button2Entity values",
  ].some(message => error.message.startsWith(message));
}


router.use(authMiddleware);
router.use(superAdminOnly);

/* -----------------------------
   GET ALL DEVICES
------------------------------ */
router.get("/", (req, res) => {
  res.json(getDevices());
});

/* -----------------------------
   GET ONE DEVICE
------------------------------ */
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid device ID",
    });
  }

  const device = getDeviceById(id);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
    });
  }

  return res.json(device);
});

/* -----------------------------
   CREATE DEVICE
------------------------------ */
router.post("/", async (req, res) => {
  try {
    const device = addDevice(req.body);

    writeAudit({
      severity: "info",
      event: "DEVICE_CREATED",
      actor: (req as any).user.username,
      target: device.name,
      details: {
        id: device.id,
        name: device.name,
        entityId: device.entityId,
        zones: device.zones,
      },
    });

    try {
      reloadDeviceEntities();
      await refreshCurrentStates();
    } catch (refreshError) {
      console.error("Device created, but Home Assistant refresh failed:", refreshError);
    }

    return res.status(201).json(device);
  } catch (error) {
    console.error("Failed to create device:", error);

    if (isDeviceValidationError(error)) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Invalid device configuration",
      });
    }

    return res.status(500).json({
      message: "Failed to create device",
    });
  }


});


/* -----------------------------
   UPDATE DEVICE
------------------------------ */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid device ID",
    });
  }

  const previousDevice = getDeviceById(id);

  if (!previousDevice) {
    return res.status(404).json({
      message: "Device not found",
    });
  }

  try {
    const device = updateDevice(id, req.body);

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    writeAudit({
      severity: "warning",
      event: "DEVICE_UPDATED",
      actor: (req as any).user.username,
      target: device.name,
      details: {
        id: device.id,
        before: {
          name: previousDevice.name,
          entityId: previousDevice.entityId,
          zones: previousDevice.zones,
          enabled: previousDevice.enabled,
        },
        after: {
          name: device.name,
          entityId: device.entityId,
          zones: device.zones,
          enabled: device.enabled,
        },
      },
    });
    try {
      reloadDeviceEntities();
      await refreshCurrentStates();
    } catch (refreshError) {
      console.error("Device updated, but Home Assistant refresh failed:", refreshError);
    }

    return res.json(device);
  } catch (error) {
    console.error("Failed to update device:", error);

    if (isDeviceValidationError(error)) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Invalid device configuration",
      });
    }

    return res.status(500).json({
      message: "Failed to update device",
    });
  }

});



/* -----------------------------
   ENABLE / DISABLE DEVICE
------------------------------ */
router.patch("/:id/enabled", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid device ID",
    });
  }

  const device = getDeviceById(id);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
    });
  }

  const enabled = req.body?.enabled;

  if (typeof enabled !== "boolean") {
    return res.status(400).json({
      message: "enabled must be a boolean",
    });
  }

  try {
    const updatedDevice = updateDevice(id, { enabled });

    if (!updatedDevice) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    writeAudit({
      severity: enabled ? "info" : "warning",
      event: enabled ? "DEVICE_ENABLED" : "DEVICE_DISABLED",
      actor: (req as any).user.username,
      target: updatedDevice.name,
      details: {
        id: updatedDevice.id,
        name: updatedDevice.name,
        entityId: updatedDevice.entityId,
        enabled,
      },
    });
    try {
      reloadDeviceEntities();
      await refreshCurrentStates();
    } catch (refreshError) {
      console.error("Device enabled state changed, but Home Assistant refresh failed:", refreshError);
    }

    return res.json(updatedDevice);
  } catch (error) {
    console.error("Failed to change device enabled state:", error);

    return res.status(500).json({
      message: "Failed to change device enabled state",
    });
  }
});


/* -----------------------------
   DELETE DEVICE
------------------------------ */
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid device ID",
    });
  }

  const device = getDeviceById(id);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
    });
  }

  try {
    const deleted = deleteDevice(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    writeAudit({
      severity: "warning",
      event: "DEVICE_DELETED",
      actor: (req as any).user.username,
      target: device.name,
      details: {
        id: device.id,
        name: device.name,
        entityId: device.entityId,
      },
    });
    try {
      reloadDeviceEntities();
      await refreshCurrentStates();
    } catch (refreshError) {
      console.error("Device deleted, but Home Assistant refresh failed:", refreshError);
    }


    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to delete device:", error);

    return res.status(500).json({
      message: "Failed to delete device",
    });
  }
});


export default router;