import express from "express";
import { reloadDeviceEntities } from "../services/haStreamService";
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

  const device = getDeviceById(id);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
    });
  }

  res.json(device);

});

/* -----------------------------
   CREATE DEVICE
------------------------------ */
router.post("/", (req,res)=>{

const device = addDevice(req.body);

reloadDeviceEntities();

writeAudit({
  severity: "info",
  event: "DEVICE_CREATED",
  actor: (req as any).user.username,
  details: {
    id: device.id,
    name: device.name,
    entityId: device.entityId,
    zones: device.zones,
  },
});

res.status(201).json(device);

});

/* -----------------------------
   UPDATE DEVICE
------------------------------ */
router.put("/:id", (req,res)=>{

  const id = Number(req.params.id);

  const device = updateDevice(id, req.body);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
    });
  }

  reloadDeviceEntities();

  res.json(device);

});

/* -----------------------------
   DELETE DEVICE
------------------------------ */
router.delete("/:id", (req,res)=>{

  const id = Number(req.params.id);

  const device = getDeviceById(id);

if (!device) {
  return res.status(404).json({
    message: "Device not found",
  });
}

deleteDevice(id);

reloadDeviceEntities();

writeAudit({
  severity: "warning",
  event: "DEVICE_DELETED",
  actor: (req as any).user.username,
  details: {
    id: device.id,
    name: device.name,
    entityId: device.entityId,
  },
});

res.json({
  success: true,
});

  res.json({
    success: true,
  });

});

export default router;