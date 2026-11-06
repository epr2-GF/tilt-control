
import { Request, Response, NextFunction } from "express";
import { readUsers } from "../data/usersStore";
import { getDeviceById } from "../services/deviceService";
import { writeAudit } from "../services/auditService";

export function timeAccessMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("⏰ TIME ACCESS MIDDLEWARE HIT");

  const currentUser = (req as any).user;

  if (!currentUser) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  const isGhostAdmin =
    currentUser.id === "0" &&
    currentUser.username === "GhostAdmin";

  const isAdministrator =
    isGhostAdmin ||
    currentUser.capabilities?.manageUsers === true;

  // Administrators bypass time restrictions completely.
  if (isAdministrator) {
    currentUser.timeAccessAllowed = true;
    return next();
  }

  const users = readUsers();

  const user = users.find(
    u => String(u.id) === String(currentUser.id)
  );

  if (!user) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  if (!user.accessStart || !user.accessEnd) {
    currentUser.timeAccessAllowed = true;
    return next();
  }

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = user.accessStart.split(":").map(Number);
  const [endH, endM] = user.accessEnd.split(":").map(Number);

  const values = [startH, startM, endH, endM];

  if (
    values.some(value => !Number.isInteger(value)) ||
    startH < 0 || startH > 23 ||
    endH < 0 || endH > 23 ||
    startM < 0 || startM > 59 ||
    endM < 0 || endM > 59
  ) {
    return res.status(500).json({
      message: "Invalid user access-time configuration",
    });
  }

  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  // Supports both normal and overnight windows.
  const allowed = start <= end
    ? current >= start && current <= end
    : current >= start || current <= end;

  currentUser.timeAccessAllowed = allowed;

  console.log("⏰ Time access:", currentUser.username, allowed);

  if (!allowed) {
    try {
      const deviceId = Number(req.body?.deviceId);
      const device = getDeviceById(deviceId);

      writeAudit({
        severity: "info",
        event: "DEVICE_COMMAND_DENIED",
        actor: currentUser.username,
        target: device?.name || String(deviceId),
        details: {
          deviceId,
          entityId: device?.entityId,
          action: req.body?.action,
          reason: "OUTSIDE_TIME_WINDOW",
          message: "Dehors horaires",
          result: "denied",
        },
      });

      console.log(
        `🚫 Command denied by time -> ${currentUser.username} -> ${device?.name || deviceId}`
      );
    } catch (error) {
      console.error(
        "Failed writing time-access denial log",
        error
      );
    }
  }

  // Preserve existing behaviour: /devices/trigger handles denial.
  return next();
}
