import { Router } from "express";
import { homeAssistantService } from "../services/homeAssistantService";
import {
  registerStreamClient,
  getCurrentStates,
} from "../services/haStreamService";


const router = Router();

// Static mapping dictionary linking internal controls to HA entity data structures
const DEVICE_MAP: Record<string, { entityId: string; domain: string }> = {
  // Now points to your fake switch for triggers
  "portail-principal": { 
    entityId: "input_boolean.fakegate", 
    domain: "input_boolean" 
  },
  "eclairage-exterieur": { 
    entityId: "light.outside_lights", 
    domain: "light" 
  },
  "porte-entrepot": {
    entityId: "input_boolean.fakedoor",
    domain: "input_boolean"
  },
  "eclairage-salle": {
    entityId: "input_boolean.fakesallelights",
    domain: "input_boolean",
  },

  "eclairage-site": {
    entityId: "input_boolean.fakesitelights",
    domain: "input_boolean",
  },

  "garage-porte-tilt": {
  entityId: "cover.garage_porte_tilt",
  domain: "cover"
  },
};

/**
 * POST /devices/trigger
 * Triggers a device state change after checking permissions
 */
router.post("/trigger", async (req, res) => {
  try {
    const { controlId, action } = req.body; 

    // 1. Verify device exists in mapping layer
    const device = DEVICE_MAP[controlId];
    if (!device) {
      return res.status(404).json({ error: "Control device mapping not found" });
    }

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
router.get("/state", (req, res) => {
  res.json(getCurrentStates());
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