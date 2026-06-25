import type { User } from "@/types/user";
import { apiFetch } from "./api";

// GET users
export async function getUsers(): Promise<User[]> {
  return apiFetch("/users");
}

// CREATE user
export async function createUser(user: User): Promise<User[]> {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

// UPDATE user
export async function updateUser(id: string, user: User): Promise<User[]> {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(user),
  });
}

// DELETE user
export async function deleteUser(id: string): Promise<User[]> {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
  });
}

// TOGGLE user disabled
export async function toggleUserDisabled(id: string): Promise<User[]> {
  return apiFetch(`/users/${id}/toggle`, {
    method: "PATCH",
  });
}