const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

if (!HA_URL || !HA_TOKEN) {
  console.warn("⚠️ Warning: HA_URL or HA_TOKEN is missing from environment variables.");
}

/**
 * Service layer to handle interactions with the Home Assistant REST API
 */
export const homeAssistantService = {
  /**
   * Fetch the current state of a specific device/entity from HA
   * @param entityId e.g., 'light.outside_lights' or 'cover.gate_main'
   */
  async getEntityState(entityId: string) {
    try {
      const response = await fetch(`${HA_URL}/api/states/${entityId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${HA_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HA API responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching HA state for ${entityId}:`, error);
      throw error;
    }
  },

  /**
   * Trigger a service action in HA (turn on, turn off, toggle, open, close)
   * @param domain The entity domain (e.g., 'light', 'cover', 'switch')
   * @param service The service action (e.g., 'turn_on', 'toggle', 'open_cover')
   * @param entityId The targeted HA entity ID
   */
  async triggerService(domain: string, service: string, entityId: string) {
    try {
      const response = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entity_id: entityId }),
      });

      if (!response.ok) {
        throw new Error(`HA API service call failed with status: ${response.status}`);
      }

      // HA returns an array of updated states for entities changed by this service call
      return await response.json();
    } catch (error) {
      console.error(`Error triggering HA service ${domain}.${service} on ${entityId}:`, error);
      throw error;
    }
  }
};