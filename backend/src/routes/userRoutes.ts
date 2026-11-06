
import express from "express";
import { readUsers, writeUsers, type User } from "../data/usersStore";
import { authMiddleware } from "../middleware/authMiddleware";
import { writeAudit } from "../services/auditService";

const router = express.Router();

const RESTRICTED_ZONES = [
  "epr2",
  "exterior",
  "logement-du-lac",
  "logement-du-tilt",
  "pecherie",
  "restaurant",
  "salle-des-fetes",
  "tilt",
] as const;

type RequestUser = {
  id: string;
  username: string;
  zones: string[];
  capabilities?: { manageUsers?: boolean };
};

function isGhostAdmin(user: RequestUser) {
  return user.id === "0" && user.username === "GhostAdmin";
}

function canManageUsers(user: RequestUser) {
  return isGhostAdmin(user) || user.capabilities?.manageUsers === true;
}

function isAdministrator(user: Partial<User>) {
  return user.capabilities?.manageUsers === true;
}

function isValidAccessTime(value: unknown): value is string {
  return typeof value === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function publicUser(user: User) {
  const { password: _password, ...safe } = user;
  return safe;
}

function auditActor(user: RequestUser) {
  return {
    actor: user.username,
    details: {
      actorId: user.id,
      actorIsGhostAdmin: isGhostAdmin(user),
    },
  };
}

router.use(authMiddleware);


/**
 * GET user credentials.
 * Only authorised administrators can retrieve credentials.
 * Normal administrators cannot retrieve another administrator's credentials.
 */
router.get("/:id/credentials", (req, res) => {
  const currentUser = (req as any).user as RequestUser;
  const ghost = isGhostAdmin(currentUser);
  const { id } = req.params;

  const target = readUsers().find(user => user.id === id);

  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }

  // Never expose the protected system account credentials.
  if (target.id === "0" || target.username === "GhostAdmin") {
    return res.status(403).json({
      message: "Cannot retrieve protected system account credentials",
    });
  }

  // Normal administrators cannot retrieve administrator credentials.
  if (isAdministrator(target) && !ghost) {
    return res.status(403).json({
      message: "Only GhostAdmin can retrieve administrator credentials",
    });
  }

  // Prevent credentials being cached by the browser or intermediary.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");

  writeAudit({
    severity: "admin",
    event: "USER_CREDENTIALS_VIEWED",
    ...auditActor(currentUser),
    target: target.username,
    details: { userId: target.id },
  });

  return res.json({
    username: target.username,
    password: target.password,
  });
});


router.use((req, res, next) => {
  const user = (req as any).user as RequestUser;

  if (!user || !canManageUsers(user)) {
    return res.status(403).json({ message: "User management access required" });
  }

  next();
});

/**
 * GET users.
 * Passwords are never returned.
 */
router.get("/", (req, res) => {
  const currentUser = (req as any).user as RequestUser;
  const ghost = isGhostAdmin(currentUser);

  const users = readUsers().filter(user => {
    // Protected system account is visible only to Superadmin.
    if (user.id === "0") return ghost;

    // Normal administrators can see themselves and other administrators,
    // but the frontend prevents them from modifying other admins.
    return true;
  });

  return res.json(users.map(publicUser));
});
/**
 * CREATE user.
 * Only GhostAdmin can create an administrator.
 */
router.post("/", (req, res) => {
  const currentUser = (req as any).user as RequestUser;
  const ghost = isGhostAdmin(currentUser);
  const body = req.body ?? {};

  if (
    typeof body.id !== "string" ||
    !body.id.trim() ||
    typeof body.username !== "string" ||
    !body.username.trim() ||
    typeof body.password !== "string" ||
    !body.password
  ) {
    return res.status(400).json({ message: "Invalid user details" });
  }

  const username = body.username.trim();

  if (username === "GhostAdmin" || body.id === "0") {
    return res.status(403).json({ message: "Reserved system account" });
  }

  const users = readUsers();

  if (users.some(user => user.id === body.id)) {
    return res.status(409).json({ message: "User ID already exists" });
  }

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ message: "Username already exists" });
  }

const requestedCapabilities = body.capabilities ?? {};

if (
  !requestedCapabilities ||
  typeof requestedCapabilities !== "object" ||
  Array.isArray(requestedCapabilities) ||
  Object.keys(requestedCapabilities).some(
    key => key !== "manageUsers"
  ) ||
  (
    requestedCapabilities.manageUsers !== undefined &&
    typeof requestedCapabilities.manageUsers !== "boolean"
  )
) {
  return res.status(400).json({
    message: "Invalid capabilities",
  });
}

const wantsAdmin = requestedCapabilities.manageUsers === true;


  if (wantsAdmin && !ghost) {
    return res.status(403).json({
      message: "Only GhostAdmin can grant administrator capability",
    });
  }

  const requestedZones = Array.isArray(body.zones) ? body.zones : [];

  if (
    requestedZones.some((zone: unknown) =>
      typeof zone !== "string" ||
      !(RESTRICTED_ZONES as readonly string[]).includes(zone)
    )
  ) {
    return res.status(400).json({ message: "Invalid zone assignment" });
  }

  const accessStart = body.accessStart ?? "08:00";
  const accessEnd = body.accessEnd ?? "18:00";

  if (!isValidAccessTime(accessStart) || !isValidAccessTime(accessEnd)) {
    return res.status(400).json({ message: "Invalid access time; expected HH:mm" });
  }

  const newUser: User = {
    id: body.id,
    username,
    password: body.password,
    zones: [...new Set(requestedZones as string[])],
    capabilities: { manageUsers: wantsAdmin },
    disabled: body.disabled === true,
    accessStart,
    accessEnd,
    remoteAccess: body.remoteAccess === true,
  };

  users.push(newUser);
  writeUsers(users);

  writeAudit({
    severity: "info",
    event: "USER_CREATED",
    ...auditActor(currentUser),
    target: newUser.username,
    details: {
      userId: newUser.id,
      zones: newUser.zones,
      manageUsers: newUser.capabilities.manageUsers,
    },
  });

  return res.status(201).json(
    users
      .filter(user => ghost || !isAdministrator(user))
      .filter(user => ghost || user.id !== "0")
      .map(publicUser)
  );
});

/**
 * UPDATE user.
 * Only allowlisted fields are accepted.
 */
router.put("/:id", (req, res) => {
  const currentUser = (req as any).user as RequestUser;
  const ghost = isGhostAdmin(currentUser);
  const { id } = req.params;
  const body = req.body ?? {};
  const users = readUsers();

  const index = users.findIndex(user => user.id === id);

  if (index < 0) {
    return res.status(404).json({ message: "User not found" });
  }

  const existing = users[index];

  if (existing.id === "0" || existing.username === "GhostAdmin") {
    return res.status(403).json({ message: "Cannot modify the protected system account" });
  }

  const targetIsAdmin = isAdministrator(existing);

  if (targetIsAdmin && !ghost) {
    return res.status(403).json({
      message: "Only GhostAdmin can modify administrator accounts",
    });
  }

  const changes: Record<string, unknown> = {};
  const updated: User = { ...existing };

  if (body.username !== undefined) {
    if (typeof body.username !== "string" || !body.username.trim()) {
      return res.status(400).json({ message: "Invalid username" });
    }

    const username = body.username.trim();

    if (username === "GhostAdmin") {
      return res.status(403).json({ message: "Reserved username" });
    }

    if (users.some(user => user.id !== id && user.username.toLowerCase() === username.toLowerCase())) {
      return res.status(409).json({ message: "Username already exists" });
    }

    if (updated.username !== username) {
      changes.username = { from: updated.username, to: username };
      updated.username = username;
    }
  }

  if (body.zones !== undefined) {
    if (
      !Array.isArray(body.zones) ||
      body.zones.some((zone: unknown) =>
        typeof zone !== "string" ||
        !(RESTRICTED_ZONES as readonly string[]).includes(zone)
      )
    ) {
      return res.status(400).json({ message: "Invalid zone assignment" });
    }

    const zones = [...new Set(body.zones as string[])];

    if (JSON.stringify(updated.zones) !== JSON.stringify(zones)) {
      changes.zones = { from: updated.zones, to: zones };
      updated.zones = zones;
    }
  }
 
  if (body.capabilities !== undefined) {
    if (
      !body.capabilities ||
      typeof body.capabilities !== "object" ||
      Array.isArray(body.capabilities) ||
      Object.keys(body.capabilities).some(key => key !== "manageUsers") ||
      typeof body.capabilities.manageUsers !== "boolean"
    ) {
      return res.status(400).json({ message: "Invalid capabilities" });
    }

    const wasAdmin = isAdministrator(updated);
    const willBeAdmin = body.capabilities.manageUsers;

    // Only the protected system administrator can change administrator access.
    if (!ghost && wasAdmin !== willBeAdmin) {
      return res.status(403).json({
        message: "You do not have permission to change administrator access",
      });
    }

    // Prevent removing the last normal administrator.
    if (wasAdmin && !willBeAdmin) {
      const normalAdminCount = users.filter(
        user =>
          user.id !== "0" &&
          user.username !== "GhostAdmin" &&
          isAdministrator(user)
      ).length;

      if (normalAdminCount <= 1) {
        return res.status(403).json({
          message: "Cannot remove administrator access from the last normal administrator",
        });
      }
    }

    if (wasAdmin !== willBeAdmin) {
      changes.manageUsers = { from: wasAdmin, to: willBeAdmin };
    }

    updated.capabilities = { manageUsers: willBeAdmin };
  }

  if (body.disabled !== undefined) {
    if (typeof body.disabled !== "boolean") {
      return res.status(400).json({ message: "Invalid disabled value" });
    }

    if (updated.disabled !== body.disabled) {
      changes.disabled = { from: updated.disabled, to: body.disabled };
      updated.disabled = body.disabled;
    }
  }

  if (body.accessStart !== undefined) {
    if (!isValidAccessTime(body.accessStart)) {
      return res.status(400).json({ message: "Invalid accessStart; expected HH:mm" });
    }

    if (updated.accessStart !== body.accessStart) {
      changes.accessStart = { from: updated.accessStart, to: body.accessStart };
      updated.accessStart = body.accessStart;
    }
  }

  if (body.accessEnd !== undefined) {
    if (!isValidAccessTime(body.accessEnd)) {
      return res.status(400).json({ message: "Invalid accessEnd; expected HH:mm" });
    }

    if (updated.accessEnd !== body.accessEnd) {
      changes.accessEnd = { from: updated.accessEnd, to: body.accessEnd };
      updated.accessEnd = body.accessEnd;
    }
  }

  if (body.remoteAccess !== undefined) {
    if (typeof body.remoteAccess !== "boolean") {
      return res.status(400).json({ message: "Invalid remoteAccess value" });
    }

    if (updated.remoteAccess !== body.remoteAccess) {
      changes.remoteAccess = { from: updated.remoteAccess, to: body.remoteAccess };
      updated.remoteAccess = body.remoteAccess;
    }
  }

  if (body.password !== undefined && body.password !== "") {
    if (typeof body.password !== "string") {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (updated.password !== body.password) {
      changes.passwordChanged = true;
      updated.password = body.password;
    }
  }

  // Ignore any other supplied properties, including id and legacy role.

  // Never allow an update to remove the last enabled normal administrator.
  const existingIsEnabledAdmin =
    existing.id !== "0" &&
    isAdministrator(existing) &&
    existing.disabled !== true;

  const updatedWillBeEnabledAdmin =
    updated.id !== "0" &&
    isAdministrator(updated) &&
    updated.disabled !== true;

  if (existingIsEnabledAdmin && !updatedWillBeEnabledAdmin) {
    const otherEnabledAdmins = users.filter(
      candidate =>
        candidate.id !== existing.id &&
        candidate.id !== "0" &&
        candidate.username !== "GhostAdmin" &&
        isAdministrator(candidate) &&
        candidate.disabled !== true
    ).length;

    if (otherEnabledAdmins === 0) {
      return res.status(403).json({
        message: "Cannot remove or disable the last enabled normal administrator",
      });
    }
  }

  users[index] = updated;

  writeUsers(users);

  if (Object.keys(changes).length > 0) {
    writeAudit({
      severity: "admin",
      event: "USER_UPDATED",
      ...auditActor(currentUser),
      target: updated.username,
      details: { userId: updated.id, changes },
    });
  }

  const visibleUsers = users.filter(user =>
    ghost || (user.id !== "0" && !isAdministrator(user))
  );

  return res.json(visibleUsers.map(publicUser));
});

/**
 * DELETE user.
 */
router.delete("/:id", (req, res) => {
  const currentUser = (req as any).user as RequestUser;
  const ghost = isGhostAdmin(currentUser);
  const { id } = req.params;
  const users = readUsers();

  const index = users.findIndex(user => user.id === id);

  if (index < 0) {
    return res.status(404).json({ message: "User not found" });
  }

  const target = users[index];

  if (target.id === "0" || target.username === "GhostAdmin") {
    return res.status(403).json({ message: "Cannot delete the protected system account" });
  }

  if (currentUser.id === id) {
    return res.status(403).json({ message: "You cannot delete your own account" });
  }

  if (isAdministrator(target) && !ghost) {
    return res.status(403).json({ message: "Only GhostAdmin can delete administrator accounts" });
  }

  if (isAdministrator(target)) {
    const normalAdminCount = users.filter(
      user => user.id !== "0" && !isGhostAdmin(user as RequestUser) && isAdministrator(user)
    ).length;

    if (normalAdminCount <= 1) {
      return res.status(403).json({ message: "Cannot delete the last normal administrator" });
    }
  }

  users.splice(index, 1);
  writeUsers(users);

  writeAudit({
    severity: "error",
    event: "USER_DELETED",
    ...auditActor(currentUser),
    target: target.username,
    details: {
      userId: target.id,
      manageUsers: isAdministrator(target),
    },
  });

  return res.json(
    users
      .filter(user => ghost || (user.id !== "0" && !isAdministrator(user)))
      .map(publicUser)
  );
});

/**
 * TOGGLE disabled.
 */
router.patch("/:id/toggle", (req, res) => {
  const currentUser = (req as any).user as RequestUser;
  const ghost = isGhostAdmin(currentUser);
  const { id } = req.params;
  const users = readUsers();

  if (currentUser.id === id) {
    return res.status(403).json({ message: "You cannot disable your own account" });
  }

  const user = users.find(user => user.id === id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.id === "0" || user.username === "GhostAdmin") {
    return res.status(403).json({ message: "Cannot disable the protected system account" });
  }

  if (isAdministrator(user) && !ghost) {
    return res.status(403).json({ message: "Only GhostAdmin can disable administrator accounts" });
  }


if (isAdministrator(user) && !user.disabled) {
  const enabledNormalAdminCount = users.filter(
    candidate =>
      candidate.id !== "0" &&
      candidate.username !== "GhostAdmin" &&
      isAdministrator(candidate) &&
      !candidate.disabled
  ).length;

  if (enabledNormalAdminCount <= 1) {
    return res.status(403).json({
      message: "Cannot disable the last enabled normal administrator",
    });
  }
}


  user.disabled = !user.disabled;
  writeUsers(users);

  writeAudit({
    severity: user.disabled ? "warning" : "info",
    event: user.disabled ? "USER_DISABLED" : "USER_ENABLED",
    ...auditActor(currentUser),
    target: user.username,
    details: { userId: user.id, disabled: user.disabled },
  });

  return res.json(
    users
      .filter(item => ghost || (item.id !== "0" && !isAdministrator(item)))
      .map(publicUser)
  );
});

export default router;
