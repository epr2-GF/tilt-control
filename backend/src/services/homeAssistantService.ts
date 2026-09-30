
const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

if (!HA_URL || !HA_TOKEN) {
  console.warn("⚠️ Warning: HA_URL or HA_TOKEN is missing from environment variables.");
}

/**
 * Service layer for local Home Assistant REST API.
 */
export const homeAssistantService = {
  /**
   * Fetch the current state of a specific HA entity.
   */
  async getEntityState(entityId: string) {
    try {
      const response = await fetch(
        `${HA_URL}/api/states/${entityId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${HA_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `HA entity not found: ${entityId} (HTTP ${response.status})`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(
        `Error fetching HA state for ${entityId}:`,
        error
      );

      throw error;
    }
  },

  /**
   * Trigger a service action in HA.
   *
   * Success means:
   * - The entity exists in Home Assistant.
   * - Home Assistant accepts the service call.
   *
   * We deliberately DO NOT check the resulting entity state because
   * some devices are momentary, use contactors, or automatically
   * change their state after receiving a command.
   */
async triggerService(
  domain: string,
  service: string,
  entityId: string,
  serviceData: Record<string, any> = {}
) {
  try {

    await this.getEntityState(entityId);

    const response = await fetch(
      `${HA_URL}/api/services/${domain}/${service}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_id: entityId,
          ...serviceData,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `HA API service call failed: ${domain}.${service} on ${entityId} (HTTP ${response.status})`
      );
    }

    let result: unknown = null;

    const text = await response.text();

    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        result = text;
      }
    }

    return result;

  } catch (error) {

    console.error(
      `Error triggering HA service ${domain}.${service} on ${entityId}:`,
      error
    );

    throw error;
  }
},
}
