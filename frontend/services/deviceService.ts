import { apiFetch } from "@/lib/api";
import { getCurrentLocation } from "@/lib/location";

export async function triggerDeviceControl(
  deviceId: string,
  action: string
) {

  const location = await getCurrentLocation();

  const data = await apiFetch("/devices/trigger", {
    method: "POST",
    body: JSON.stringify({
      controlId: deviceId,
      action,
      latitude: location.latitude,
      longitude: location.longitude,
    }),
  });

  return data;
}