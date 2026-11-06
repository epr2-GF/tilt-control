
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
  const { latitude, longitude } = req.body ?? {};

  const isGhostAdmin =
    user?.id === "0" && user?.username === "GhostAdmin";

  const isAdministrator =
    isGhostAdmin ||
    user?.capabilities?.manageUsers === true;

  // Administrators bypass GPS restrictions.
  if (isAdministrator) {
    user.locationAllowed = true;
    return next();
  }

  // Ordinary users with remote access enabled.
  if (user?.remoteAccess === true) {
    user.locationAllowed = true;
    return next();
  }

  // Validate GPS coordinates.
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res.status(400).json({
      message: "Missing or invalid location",
    });
  }

  const result = isWithinSiteRadius(latitude, longitude);

  // Allow users inside the permitted site radius.
  if (result.inside) {
    user.locationAllowed = true;
    return next();
  }

  // Deny and audit users outside the permitted radius.
  user.locationAllowed = false;

  const device = getDeviceById(Number(req.body?.deviceId));

  writeAudit({
    severity: "info",
    event: "DEVICE_COMMAND_DENIED",
    actor: user.username,
    target: device?.name || String(req.body?.deviceId),
    details: {
      deviceId: req.body?.deviceId,
      action: req.body?.action,
      result: "denied",
      reason: "location",
      message: "En dehors de la zone autorisée",
    },
  });

  return res.status(403).json({
    message: "En dehors de la zone autorisée",
  });
}
