import type { User } from "@/types/user";

const STORAGE_KEY = "smart-site-users";

/* -----------------------------
   READ USERS
------------------------------ */
export function getUsers(): User[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/* -----------------------------
   SAVE USERS
------------------------------ */
export function saveUsers(users: User[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

/* -----------------------------
   ADD USER
------------------------------ */
export function addUser(user: User): User[] {
  const users = getUsers();

  const updated = [...users, user];
  saveUsers(updated);

  return updated;
}

/* -----------------------------
   DELETE USER
------------------------------ */
export function deleteUser(id: string): User[] {
  const users = getUsers();

  const updated = users.filter((u) => u.id !== id);
  saveUsers(updated);

  return updated;
}

/* -----------------------------
   TOGGLE DISABLED
------------------------------ */
export function toggleUserDisabled(id: string): User[] {
  const users = getUsers();

  const updated = users.map((u) =>
    u.id === id
      ? { ...u, disabled: !u.disabled }
      : u
  );

  saveUsers(updated);

  return updated;
}

/* -----------------------------
   UPDATE USER
------------------------------ */
export function updateUser(updatedUser: User): User[] {
  const users = getUsers();

  const updated = users.map((u) =>
    u.id === updatedUser.id ? updatedUser : u
  );

  saveUsers(updated);

  return updated;
}