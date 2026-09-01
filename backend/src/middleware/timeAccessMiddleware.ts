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

  /*
   * ---------------------------------------------------------
   * AUTHENTICATION CHECK
   * ---------------------------------------------------------
   */

  if (!currentUser) {

    return res.status(401).json({
      message: "Not authenticated",
    });

  }


  /*
   * ---------------------------------------------------------
   * ADMIN BYPASS
   * ---------------------------------------------------------
   */

  if (currentUser.role === "admin") {

    return next();

  }


  /*
   * ---------------------------------------------------------
   * LOAD USER
   * ---------------------------------------------------------
   */

  const users = readUsers();

  const user =
    users.find(
      u => u.id === currentUser.id
    );

  if (!user) {

    return res.status(401).json({
      message: "User not found",
    });

  }


  /*
   * ---------------------------------------------------------
   * NO TIME RESTRICTION
   * ---------------------------------------------------------
   */

  if (!user.accessStart || !user.accessEnd) {

    (req as any).user.timeAccessAllowed = true;

    return next();

  }


  /*
   * ---------------------------------------------------------
   * CALCULATE CURRENT TIME
   * ---------------------------------------------------------
   */

  const now =
    new Date();

  const current =
    now.getHours() * 60 +
    now.getMinutes();


  /*
   * ---------------------------------------------------------
   * CONVERT USER TIME WINDOW TO MINUTES
   * ---------------------------------------------------------
   */

  const [startH, startM] =
    user.accessStart
      .split(":")
      .map(Number);

  const [endH, endM] =
    user.accessEnd
      .split(":")
      .map(Number);


  const start =
    startH * 60 +
    startM;

  const end =
    endH * 60 +
    endM;


  /*
   * ---------------------------------------------------------
   * CHECK TIME WINDOW
   * ---------------------------------------------------------
   *
   * Normal:
   *   08:00 -> 18:00
   *
   * Overnight:
   *   22:00 -> 06:00
   * ---------------------------------------------------------
   */

  let allowed: boolean;

  if (start <= end) {

    allowed =
      current >= start &&
      current <= end;

  } else {

    allowed =
      current >= start ||
      current <= end;

  }


  /*
   * Store the result for /devices/trigger.
   */

  (req as any).user.timeAccessAllowed =
    allowed;


  console.log(
    "⏰ Time access:",
    currentUser.username,
    allowed
  );


  /*
   * ---------------------------------------------------------
   * USER LOG — TIME DENIAL
   * ---------------------------------------------------------
   *
   * We deliberately use the audit/user log here.
   *
   * This is NOT a device status log.
   *
   * The actual device command will subsequently be
   * rejected by /devices/trigger.
   * ---------------------------------------------------------
   */

  if (!allowed) {

    try {

      const deviceId =
        Number(req.body?.deviceId);

      const device =
        getDeviceById(deviceId);


      writeAudit({

        severity: "info",

        event:
          "DEVICE_COMMAND_DENIED",

        actor:
          currentUser.username,

        target:
          device?.name ||
          String(deviceId),

        details: {

          deviceId,

          entityId:
            device?.entityId,

          action:
            req.body?.action,

          reason:
            "OUTSIDE_TIME_WINDOW",

          message:
            "Dehors horaires",

          result:
            "denied",

        },

        role:
          currentUser.role,

      });


      console.log(
        `🚫 USER command denied by time -> ${currentUser.username} -> ${device?.name || deviceId}`
      );

    } catch (error) {

      /*
       * Logging failure must never prevent
       * the normal access-control decision.
       */

      console.error(
        "❌ Failed writing time-access denial log",
        error
      );

    }

  }


  /*
   * ---------------------------------------------------------
   * CONTINUE TO /devices/trigger
   * ---------------------------------------------------------
   *
   * /devices/trigger sees timeAccessAllowed === false
   * and returns OUTSIDE_TIME_WINDOW.
   */

  next();

}