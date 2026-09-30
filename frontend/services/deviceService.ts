import { apiFetch } from "@/lib/api";
import { getCurrentLocation } from "@/lib/location";

export async function triggerDeviceControl(
  deviceId: string,
  action: string,
  data: Record<string, any> = {}
) {
  const location = await getCurrentLocation();

  const response = await apiFetch(
    "/devices/trigger",
    {
      method: "POST",
      body: JSON.stringify({
        deviceId,
        action,
        ...data,
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    }
  );

  return response;
}
