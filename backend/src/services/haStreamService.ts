import WebSocket from "ws";
import { DEVICE_ENTITIES } from "../config/deviceEntities";

const HA_URL = process.env.HA_URL || "";
const HA_TOKEN = process.env.HA_TOKEN || "";

// Convert HTTPS to WSS or HTTP to WS for the Nabu Casa tunnel URL
const WS_URL = HA_URL.replace(/^http/, "ws") + "/api/websocket";

// Track active client streams (Next.js frontend listeners)
let frontendClients = new Set<any>();

// Current state cache
const entityStateCache: Record<string, any> = {};

let ws: WebSocket | null = null;

let reconnectTimer: NodeJS.Timeout | null = null;

let healthTimer: NodeJS.Timeout | null = null;

let lastMessageTime = Date.now();

let reconnectAttempts = 0;

let connected = false;

// Whitelist of entities our web app actually cares about
const SSE_ENTITIES = [
  ...new Set(
    Object.values(DEVICE_ENTITIES)
      .flatMap(device => [
        device.command,
        device.status,
      ])
      .filter(Boolean)
  ),
];

export function getCurrentStates() {
  return entityStateCache;
}

export function registerStreamClient(res: any) {

  frontendClients.add(res);

  console.log(
    `✅ SSE client connected. Active clients: ${frontendClients.size}`
  );

  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);


  res.on("close", () => {

    clearInterval(heartbeat);

    frontendClients.delete(res);

    console.log(
      `❌ SSE client disconnected. Active clients: ${frontendClients.size}`
    );
  });
}

function broadcastToFrontend(entityId: string, newState: any) {

  const data = JSON.stringify({
    entityId,
    state: newState.state,
    attributes: newState.attributes,
  });

  console.log(
    `📡 Broadcasting ${entityId}:${newState.state} to ${frontendClients.size} clients`
  );


  frontendClients.forEach((client) => {

    try {

      client.write(`data: ${data}\n\n`);

    } catch (err) {

      console.error("❌ SSE write failed. Removing client.");

      frontendClients.delete(client);

    }

  });
}

export function initHomeAssistantStream() {

  if (!HA_URL || !HA_TOKEN) return;

  console.log("🔌 Connecting to Home Assistant WebSocket Stream...");

  // Close any existing socket first
if (ws) {

    connected = false;

    console.log("♻️ Closing previous HA websocket");

    ws.removeAllListeners();

    ws.terminate();

}

if (healthTimer) {
  clearInterval(healthTimer);
  healthTimer = null;
}

if (reconnectTimer) {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

  ws = new WebSocket(WS_URL);

ws.on("open", () => {

  connected = true;
  reconnectAttempts = 0;

  console.log("🟩 HA websocket connected");
});

  ws.on("message", (rawMessage: string) => {
    lastMessageTime = Date.now();
    const msg = JSON.parse(rawMessage);

    // -------------------------------------------------
    // Home Assistant requests authentication
    // -------------------------------------------------
    if (msg.type === "auth_required") {
      ws!.send(
        JSON.stringify({
          type: "auth",
          access_token: HA_TOKEN,
        })
      );
      return;
    }

    // -------------------------------------------------
    // Authentication successful
    // -------------------------------------------------
if (msg.type === "auth_ok") {

  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }

  healthTimer = setInterval(() => {

    const age = Date.now() - lastMessageTime;

    if (age > 120000) {

      console.warn(`💀 No HA messages for ${Math.round(age / 1000)} seconds. Restarting websocket...`);

      ws?.terminate();

    }

  }, 30000);
      // Request current state of every entity
      ws!.send(
        JSON.stringify({
          id: 1,
          type: "get_states",
        })
      );

      // Subscribe to future updates
      ws!.send(
        JSON.stringify({
          id: 2,
          type: "subscribe_events",
          event_type: "state_changed",
        })
      );

      return;
    }

// -------------------------------------------------
// Initial snapshot
// -------------------------------------------------
if (
  msg.id === 1 &&
  msg.type === "result" &&
  Array.isArray(msg.result)
) {
  console.log("📥 Loading initial Home Assistant state cache...");

  msg.result.forEach((entity: any) => {

    if (SSE_ENTITIES.includes(entity.entity_id)) {

      entityStateCache[entity.entity_id] = {
        state: entity.state,
        attributes: entity.attributes,
      };

      console.log(
        `📥 ${entity.entity_id} = ${entity.state}`
      );

      if (entity.entity_id === "cover.garage_porte_tilt") {
        console.log(
          "🚪 Garage position:",
          entity.attributes?.current_position
        );
      }

    }

  });

  console.log("✅ Home Assistant cache ready.");

  return;
}

    // -------------------------------------------------
    // Live state updates
    // -------------------------------------------------
    if (
      msg.type === "event" &&
      msg.event?.event_type === "state_changed"
    ) {
      const eventData = msg.event.data;

      if (!eventData) return;

      const entityId = eventData.entity_id;
      const newState = eventData.new_state;

      if (
        entityId &&
        newState &&
        SSE_ENTITIES.includes(entityId)
      ) {
        entityStateCache[entityId] = {
  state: newState.state,
  attributes: newState.attributes,
};

        console.log(
          `🎯 Stream Broadcast -> ${entityId}: ${newState.state}`
        );

        broadcastToFrontend(entityId, newState);
      }

      return;
    }
  });

ws.on("close", () => {

  connected = false;

  console.warn("⚠️ HA websocket closed");

  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }

  if (!reconnectTimer) {

    reconnectAttempts++;

    const delay =
      Math.min(
        reconnectAttempts * 5000,
        60000
      );

    console.log(
      `🔄 Reconnecting in ${delay / 1000}s`
    );

    reconnectTimer = setTimeout(() => {

      reconnectTimer = null;

      initHomeAssistantStream();

    }, delay);

  }

});
ws.on("error", (err) => {
  console.error("❌ HA websocket error:", err.message);
});
}