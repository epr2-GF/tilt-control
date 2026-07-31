import express from "express";
import { readUsers, writeUsers } from "../data/usersStore";
import { authMiddleware } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(["admin","superadmin"]));

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
    const {
      password,
      ...rest
    } = user;

    return rest;
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
  if (!newUser?.id || !newUser?.username) {
    return res.status(400).json({ message: "Invalid user" });
  }

return res.json(
  users.map(({password, ...user}) => user)
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

  const existingUser = users.find(u => u.id === id);

  if (!existingUser) {
    return res.status(404).json({ 
      message: "User not found" 
    });
  }


  // ❌ Admin cannot modify superadmin
  if (
    existingUser.role === "superadmin" &&
    currentUser.role !== "superadmin"
  ) {
    return res.status(403).json({
      message: "Cannot modify superadmin account",
    });
  }


  // ❌ Admin cannot promote users to superadmin
  if (
    updatedUser.role === "superadmin" &&
    currentUser.role !== "superadmin"
  ) {
    return res.status(403).json({
      message: "Only superadmin can assign superadmin role",
    });
  }


  // ❌ prevent removing last admin role
  if (
    existingUser.role === "admin" &&
    updatedUser.role !== "admin"
  ) {

    const adminCount =
      users.filter(
        u => u.role === "admin"
      ).length;


    if (adminCount <= 1) {
      return res.status(403).json({
        message:
          "Cannot remove admin role from the last admin",
      });
    }
  }


  const index =
    users.findIndex(
      u => u.id === id
    );


const {
  password,
  ...safeUpdate
} = updatedUser;


users[index] = {
  ...users[index],
  ...safeUpdate,
  id,
};


  writeUsers(users);

  return res.json(users);
});

/**
 * DELETE user
 */
router.delete("/:id", (req, res) => {
  const users = readUsers();

  const { id } = req.params;
  const currentUser = (req as any).user;

  const userToDelete = users.find(u => u.id === id);

  if (!userToDelete) {
    return res.status(404).json({ message: "User not found" });
  }

  // ❌ prevent self-delete
  if (currentUser.id === id) {
    return res.status(403).json({
      message: "You cannot delete your own account",
    });
  }

  // ❌ prevent deleting last admin
  if (userToDelete.role === "admin") {
    const adminCount = users.filter(u => u.role === "admin").length;

    if (adminCount <= 1) {
      return res.status(403).json({
        message: "Cannot delete the last admin",
      });
    }
  }
// ❌ prevent deleting superadmin
if (
  userToDelete.role === "superadmin" &&
  currentUser.role !== "superadmin"
) {
  return res.status(403).json({
    message: "Cannot delete superadmin account",
  });
}
  const index = users.findIndex(u => u.id === id);

  users.splice(index, 1);
  writeUsers(users);

  return res.json(users);
});

/**
 * TOGGLE disabled
 */
router.patch("/:id/toggle", (req, res) => {
  const users = readUsers();

  const { id } = req.params;
  const currentUser = (req as any).user;


  // ❌ prevent self-disable
  if (currentUser.id === id) {
    return res.status(403).json({
      message: "You cannot disable your own account",
    });
  }


  const user = users.find(
    (u) => u.id === id
  );


  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }


  // ❌ prevent disabling superadmin
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


  return res.json(users);
});

export default router;