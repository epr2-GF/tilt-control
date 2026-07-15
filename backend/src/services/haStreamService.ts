import WebSocket from "ws";

const HA_URL = process.env.HA_URL || "";
const HA_TOKEN = process.env.HA_TOKEN || "";

// Convert HTTPS to WSS or HTTP to WS for the Nabu Casa tunnel URL
const WS_URL = HA_URL.replace(/^http/, "ws") + "/api/websocket";

// Track active client streams (Next.js frontend listeners)
let frontendClients: any[] = [];

// Current state cache
const entityStateCache: Record<string, string> = {};

// Whitelist of entities our web app actually cares about
const ALLOWED_ENTITIES = [
  "input_boolean.fakegate",
  "light.outside_lights",
  "warehouse.door",
];

export function getCurrentStates() {
  return entityStateCache;
}

export function registerStreamClient(res: any) {

  frontendClients.push(res);

  console.log(
    `✅ SSE client connected. Active clients: ${frontendClients.length}`
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

    frontendClients = frontendClients.filter(
      (client) => client !== res
    );

    console.log(
      `❌ SSE client disconnected. Active clients: ${frontendClients.length}`
    );
  });
}

function broadcastToFrontend(entityId: string, newState: string) {

  const data = JSON.stringify({
    entityId,
    state: newState,
  });

  console.log(
    `📡 Broadcasting ${entityId}:${newState} to ${frontendClients.length} clients`
  );


  frontendClients.forEach((client) => {

    try {

      client.write(`data: ${data}\n\n`);

    } catch (err) {

      console.error("❌ SSE write failed. Removing client.");

      frontendClients = frontendClients.filter(
        (c) => c !== client
      );

    }

  });
}

export function initHomeAssistantStream() {
  if (!HA_URL || !HA_TOKEN) return;

  console.log("🔌 Connecting to Home Assistant WebSocket Stream...");

  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    console.log("🟩 HA WebSocket Transport channel open.");
  });

  ws.on("message", (rawMessage: string) => {
    const msg = JSON.parse(rawMessage);

    // -------------------------------------------------
    // Home Assistant requests authentication
    // -------------------------------------------------
    if (msg.type === "auth_required") {
      ws.send(
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
      console.log("🔒 HA WebSocket authenticated successfully!");

      // Request current state of every entity
      ws.send(
        JSON.stringify({
          id: 1,
          type: "get_states",
        })
      );

      // Subscribe to future updates
      ws.send(
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
        if (ALLOWED_ENTITIES.includes(entity.entity_id)) {
          entityStateCache[entity.entity_id] = entity.state;

          console.log(
            `📥 ${entity.entity_id} = ${entity.state}`
          );
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
        ALLOWED_ENTITIES.includes(entityId)
      ) {
        entityStateCache[entityId] = newState.state;

        console.log(
          `🎯 Stream Broadcast -> ${entityId}: ${newState.state}`
        );

        broadcastToFrontend(entityId, newState.state);
      }

      return;
    }
  });

  ws.on("close", () => {
    console.warn(
      "⚠️ HA WebSocket disconnected. Reconnecting in 5 seconds..."
    );

    setTimeout(initHomeAssistantStream, 5000);
  });

  ws.on("error", (err) => {
    console.error("❌ HA WebSocket Error:", err.message);
  });
}