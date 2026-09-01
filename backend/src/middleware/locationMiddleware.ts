import { Request, Response, NextFunction } from "express";
import { isWithinSiteRadius } from "../services/locationService";
import { writeAudit } from "../services/auditService";
import { getDeviceById } from "../services/deviceService";

export function locationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;

  const { latitude, longitude } = req.body;

  console.log("📍 Location check:", {
    user: user?.username,
    role: user?.role,
    latitude,
    longitude,
  });

  // Admins always allowed
  if (user?.role === "admin") {
    user.locationAllowed = true;

    console.log("✅ Admin bypass");

    return next();
  }

  // Users with remote access enabled
  if (user?.remoteAccess) {
    user.locationAllowed = true;

    console.log("🌍 Remote access enabled");

    return next();
  }

  // Missing GPS
  if (latitude == null || longitude == null) {
    return res.status(400).json({
      message: "Location required",
    });
  }

  // Calculate distance
  const result = isWithinSiteRadius(latitude, longitude);

  console.log("🏠 Site configuration:", {
    latitude: process.env.SITE_LATITUDE,
    longitude: process.env.SITE_LONGITUDE,
    radius: process.env.SITE_RADIUS_METERS,
  });

  console.log("📱 User location:", {
    latitude,
    longitude,
  });

  console.log("📏 Distance:", {
    metres: result.distance.toFixed(1),
    inside: result.inside,
  });

  if (result.inside) {
    user.locationAllowed = true;

    console.log("✅ User inside permitted area");

    return next();
  }

user.locationAllowed = false;

console.log("❌ User outside permitted area");

const device =
  getDeviceById(
    Number(req.body?.deviceId)
  );

writeAudit({
  severity: "info",
  event: "DEVICE_COMMAND_DENIED",
  actor: user.username,
  target:
   device?.name ||
   String(req.body?.deviceId),

  details: {
    deviceId: req.body?.deviceId,
    action: req.body?.action,
    result: "denied",
    reason: "location",
    message: "En dehors de la zone autorisée",
  },

  role: user.role,
});

return res.status(403).json({
  message: "En dehors de la zone autorisée",
});
}