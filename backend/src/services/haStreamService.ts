import WebSocket from "ws";

const HA_URL = process.env.HA_URL || "";
const HA_TOKEN = process.env.HA_TOKEN || "";

// Convert HTTPS to WSS or HTTP to WS for the Nabu Casa tunnel URL
const WS_URL = HA_URL.replace(/^http/, "ws") + "/api/websocket";

// Track active client streams (Next.js frontend listeners)
let frontendClients: any[] = [];

export function registerStreamClient(res: any) {
  frontendClients.push(res);
  // Clean up when frontend disconnects
  res.on("close", () => {
    frontendClients = frontendClients.filter((client) => client !== res);
  });
}

function broadcastToFrontend(entityId: string, newState: any) {
  const data = JSON.stringify({ entityId, state: newState });
  frontendClients.forEach((client) => {
    client.write(`data: ${data}\n\n`); // Standard SSE format
  });
}

export function initHomeAssistantStream() {
  if (!HA_URL || !HA_TOKEN) return;

  console.log("🔌 Connecting to Home Assistant WebSocket Stream...");
  const ws = new WebSocket(WS_URL);
  let interactionId = 1;

  ws.on("open", () => {
    console.log("🟩 HA WebSocket Transport channel open.");
  });

  ws.on("message", (rawMessage: string) => {
    const msg = JSON.parse(rawMessage);

    // 1. Handle HA Auth Request
    if (msg.type === "auth_required") {
      ws.send(JSON.stringify({ type: "auth", access_token: HA_TOKEN }));
    }

    // 2. Handle successful Auth -> Now subscribe to events
    if (msg.type === "auth_ok") {
      console.log("🔒 HA WebSocket authenticated successfully!");
      
      // Subscribe to all state changes
      ws.send(JSON.stringify({
        id: interactionId++,
        type: "subscribe_events",
        event_type: "state_changed"
      }));
    }

// 📋 Whitelist of entities our web app actually cares about
const ALLOWED_ENTITIES = [
  "input_boolean.fakegate",
  "light.outside_lights",
  "warehouse.door" // Add your other controlled entity IDs here
];

// ... inside ws.on("message") ...

// 3. Catch fired state events and stream them to frontend clients
if (msg.type === "event" && msg.event?.event_type === "state_changed") {
  const eventData = msg.event.data?.event || msg.event.data;
  
  if (eventData) {
    const entity_id = eventData.entity_id;
    const new_state = eventData.new_state;

    // 🛑 SECURITY/DATA GUARD: Only proceed if the entity is in our whitelist
    if (entity_id && ALLOWED_ENTITIES.includes(entity_id) && new_state) {
      
      // Keep this log so you can easily debug the things you actually care about!
      console.log(`🎯 Stream Broadcast -> ${entity_id}: ${new_state.state}`);
      
      broadcastToFrontend(entity_id, new_state.state);
    }
  }
}
  });

  ws.on("close", () => {
    console.warn("⚠️ HA WebSocket disconnected. Reconnecting in 5 seconds...");
    setTimeout(initHomeAssistantStream, 5000);
  });

  ws.on("error", (err) => {
    console.error("❌ HA WebSocket Error:", err.message);
  });
}