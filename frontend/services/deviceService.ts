import { apiFetch } from "@/lib/api"; // 👈 Import the actual function exported by your lib

export async function triggerDeviceControl(deviceId: string, action: string) {
  // Use your app's built-in authorized fetch handler
  const data = await apiFetch("/devices/trigger", {
    method: "POST",
    body: JSON.stringify({
      controlId: deviceId,
      action,
    }),
  });
  
  return data;
}