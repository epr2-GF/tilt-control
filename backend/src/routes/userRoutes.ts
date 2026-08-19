import express from "express";
import { readUsers, writeUsers } from "../data/usersStore";
import { authMiddleware } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { writeAudit } from "../services/auditService";
const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(["admin", "superadmin"]));

function sanitizeUsersFor(currentUser: any, users: any[]) {
  let visibleUsers = [...users];

  // Hide superadmins from non-superadmins
  if (currentUser.role !== "superadmin") {
    visibleUsers = visibleUsers.filter(
      u => u.role !== "superadmin"
    );
  }

  return visibleUsers.map(user => {
    // Never expose GhostAdmin password
    if (user.id === "0") {
      const { password, ...rest } = user;
      return rest;
    }

    return user;
  });
}

/**
 * GET all users
 */
router.get("/", (req, res) => {
  const currentUser = (req as any).user;
  let users = readUsers();

  if (currentUser.role !== "superadmin") {
    users = users.filter(
      user => user.role !== "superadmin"
    );
  }

  const safeUsers = users.map(user => {
    if (user.id === "0") {
      const { password, ...rest } = user;
      return rest;
    }

    return user;
  });

  res.json(safeUsers);
});

/**
 * CREATE user
 */
router.post("/", (req, res) => {
  const users = readUsers();
  const newUser = req.body;
  const currentUser = (req as any).user;

  if (
    newUser.role === "superadmin" &&
    currentUser.role !== "superadmin"
  ) {
    return res.status(403).json({
      message: "Only superadmin can create superadmin accounts",
    });
  }

  if (
    !newUser?.id ||
    !newUser?.username ||
    !newUser?.password
  ) {
    return res.status(400).json({
      message: "Invalid user",
    });
  }

  users.push(newUser);
  writeUsers(users);

  // Do not log creation of superadmin accounts
  if (
    newUser.role !== "superadmin" &&
    newUser.id !== "0"
  ) {
    writeAudit({
      severity: "info",
      event: "USER_CREATED",
      actor: currentUser.username,
      target: newUser.username,
      role: currentUser.role,
      details: {
        userId: newUser.id,
        userRole: newUser.role,
      },
    });
  }

  return res.json(
    sanitizeUsersFor(currentUser, users)
  );
});

/**
 * UPDATE user
 */
router.put("/:id", (req, res) => {
  const users = readUsers();
  const { id } = req.params;
  const updatedUser = req.body;
  const currentUser = (req as any).user;

  const existingUser = users.find(
    u => u.id === id
  );

  if (!existingUser) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  // Never modify GhostAdmin
  if (existingUser.id === "0") {
    return res.status(403).json({
      message: "Cannot modify system superadmin account",
    });
  }

  // Admin cannot modify superadmin
  if (
    existingUser.role === "superadmin" &&
    currentUser.role !== "superadmin"
  ) {
    return res.status(403).json({
      message: "Cannot modify superadmin account",
    });
  }

  // Admin cannot promote to superadmin
  if (
    updatedUser.role === "superadmin" &&
    currentUser.role !== "superadmin"
  ) {
    return res.status(403).json({
      message: "Only superadmin can assign superadmin role",
    });
  }

  // Prevent removing last admin role
  if (
    existingUser.role === "admin" &&
    updatedUser.role !== "admin"
  ) {
    const adminCount = users.filter(
      u => u.role === "admin"
    ).length;

    if (adminCount <= 1) {
      return res.status(403).json({
        message:
          "Cannot remove admin role from the last admin",
      });
    }
  }

  const index = users.findIndex(
    u => u.id === id
  );

  /*
   * Record meaningful changes.
   * Password is deliberately excluded.
   */
const changes: Record<string, unknown> = {};

if (existingUser.username !== updatedUser.username) {
  changes.username = {
    from: existingUser.username,
    to: updatedUser.username,
  };
}

if (existingUser.role !== updatedUser.role) {
  changes.role = {
    from: existingUser.role,
    to: updatedUser.role,
  };
}

if (existingUser.disabled !== updatedUser.disabled) {
  changes.disabled = {
    from: existingUser.disabled,
    to: updatedUser.disabled,
  };
}

if (existingUser.accessStart !== updatedUser.accessStart) {
  changes.accessStart = {
    from: existingUser.accessStart,
    to: updatedUser.accessStart,
  };
}

if (existingUser.accessEnd !== updatedUser.accessEnd) {
  changes.accessEnd = {
    from: existingUser.accessEnd,
    to: updatedUser.accessEnd,
  };
}

if (existingUser.remoteAccess !== updatedUser.remoteAccess) {
  changes.remoteAccess = {
    from: existingUser.remoteAccess,
    to: updatedUser.remoteAccess,
  };
}

if (
  updatedUser.password &&
  updatedUser.password !== existingUser.password
) {
  changes.password = true;
}

  users[index] = {
    ...users[index],
    ...updatedUser,
    id,
  };

  writeUsers(users);

  /*
   * Do not log modifications to superadmin accounts.
   */
  if (
    existingUser.role !== "superadmin" &&
    Object.keys(changes).length > 0
  ) {
    writeAudit({
      severity: "admin",
      event: "USER_UPDATED",
      actor: currentUser.username,
      target: existingUser.username,
      role: currentUser.role,
      details: {
        userId: existingUser.id,
        changes,
      },
    });
  }

  return res.json(
    sanitizeUsersFor(currentUser, users)
  );
});

/**
 * DELETE user
 */
router.delete("/:id", (req, res) => {
  const users = readUsers();
  const { id } = req.params;
  const currentUser = (req as any).user;

  const userToDelete = users.find(
    u => u.id === id
  );

  if (!userToDelete) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  // Prevent self-delete
  if (currentUser.id === id) {
    return res.status(403).json({
      message: "You cannot delete your own account",
    });
  }

  // Prevent deleting last admin
  if (userToDelete.role === "admin") {
    const adminCount = users.filter(
      u => u.role === "admin"
    ).length;

    if (adminCount <= 1) {
      return res.status(403).json({
        message: "Cannot delete the last admin",
      });
    }
  }

  // Prevent deleting superadmin unless current user is superadmin
  if (
    userToDelete.role === "superadmin" &&
    currentUser.role !== "superadmin"
  ) {
    return res.status(403).json({
      message: "Cannot delete superadmin account",
    });
  }

  const index = users.findIndex(
    u => u.id === id
  );

  users.splice(index, 1);
  writeUsers(users);

  /*
   * Never put superadmin deletion into the normal
   * user audit log.
   */
  if (
    userToDelete.role !== "superadmin" &&
    userToDelete.id !== "0"
  ) {
    writeAudit({
      severity: "error",
      event: "USER_DELETED",
      actor: currentUser.username,
      target: userToDelete.username,
      role: currentUser.role,
      details: {
        userId: userToDelete.id,
        userRole: userToDelete.role,
      },
    });
  }

  return res.json(
    sanitizeUsersFor(currentUser, users)
  );
});

/**
 * TOGGLE disabled
 */
router.patch("/:id/toggle", (req, res) => {
  const users = readUsers();
  const { id } = req.params;
  const currentUser = (req as any).user;

  // Prevent self-disable
  if (currentUser.id === id) {
    return res.status(403).json({
      message: "You cannot disable your own account",
    });
  }

  const user = users.find(
    u => u.id === id
  );

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  // Prevent disabling superadmin
  if (
    user.role === "superadmin" &&
    currentUser.role !== "superadmin"
  ) {
    return res.status(403).json({
      message: "Cannot disable superadmin account",
    });
  }

  user.disabled = !user.disabled;

  writeUsers(users);

  /*
   * Do not log superadmin enable/disable.
   */
  if (
    user.role !== "superadmin" &&
    user.id !== "0"
  ) {
    writeAudit({
      severity: user.disabled
        ? "warning"
        : "info",
      event: user.disabled
        ? "USER_DISABLED"
        : "USER_ENABLED",
      actor: currentUser.username,
      target: user.username,
      role: currentUser.role,
      details: {
        userId: user.id,
        disabled: user.disabled,
      },
    });
  }

  return res.json(
    sanitizeUsersFor(currentUser, users)
  );
});

export default router;