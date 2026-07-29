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

const router = Router();

console.log("✅ deviceRoutes loaded");
/**
 * GET /devices
 * Returns all configured devices
 */
router.get("/", (req, res) => {
  res.json(getDevices());
});

/**
 * POST /devices/trigger
 * Triggers a device state change after checking permissions
 */

router.post(
  "/trigger",
  timeAccessMiddleware,
  locationMiddleware,
  async (req,res)=>{
 
    const user = (req as any).user;

console.log("🔐 DEVICE PERMISSION CHECK", {
  user:user.username,
  time:user.timeAccessAllowed,
  location:user.locationAllowed
});


if (user.timeAccessAllowed === false) {

  return res.status(403).json({
    code:"OUTSIDE_TIME_WINDOW",
    message:"En dehors des horaires autorisés"
  });

}
  try {
    console.log("Request body:", req.body);
const { deviceId, action } = req.body;

console.log("Incoming deviceId:", deviceId);

const savedDevice = getDeviceById(Number(deviceId));

if (!savedDevice) {

  return res.status(404).json({
    error:"Device not found"
  });

}


const device = {

  entityId: savedDevice.entityId,

  domain: savedDevice.entityId.split(".")[0]

};

    // 2. Map actions to domain-specific HA actions
    let haService = action; 
    
    // If it's your helper toggle switch, let's make sure it translates cleanly
    if (device.domain === "input_boolean" && action === "toggle") {
      haService = "toggle";
    }

    // 3. Dispatch call to Home Assistant via Nabu Casa tunnel
    const result = await homeAssistantService.triggerService(
      device.domain,
      haService,
      device.entityId
    );

    return res.json({ success: true, updatedState: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to execute HA service" });
  }
});

/**
 * GET /devices/state
 * Returns the latest cached Home Assistant states
 */
router.get("/state", async (req, res) => {

  try {

    // Ask Home Assistant for fresh states
    refreshHAStates();

    // Small delay to allow websocket response
    await new Promise(resolve =>
      setTimeout(resolve, 500)
    );

    res.json(getCurrentStates());

  } catch(error) {

    console.error(
      "Failed refreshing HA states",
      error
    );

    res.json(getCurrentStates());

  }

});


/**
 * GET /devices/stream
 * Establishes an HTTP text-stream (SSE) connection for real-time state push notifications
 */
router.get("/stream", (req, res) => {

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Important for Nginx / reverse proxies
  res.setHeader("X-Accel-Buffering", "no");

  // Immediately open stream
  res.flushHeaders();

  // Send initial comment so connection is active
  res.write(": connected\n\n");

  console.log("📡 SSE stream opened");

  // Register browser client
  registerStreamClient(res);
});

// ✅ Always keep export default at the absolute bottom of the file
export default router;