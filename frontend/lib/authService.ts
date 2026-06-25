
import { getUsersStorage, saveUsersStorage } from "./storage";

/**
 * Seed default admin user
 */
export function initUsers() {
  const existing = getUsersStorage();

  if (!existing || existing.length === 0) {
    saveUsersStorage([
      {
        id: "1",
        username: "admin",
        password: "admin",
        role: "admin",
        disabled: false,
        accessStart: "00:00",
        accessEnd: "23:59",
      },
    ]);
  }
}

/**
 * LOGIN LOGIC
 */
export async function loginService(
  username: string,
  password: string
) {

  const res = await fetch(
    "http://192.168.0.180:4000/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

// export async function loginService(username: string, password: string) {
//  console.log("1️⃣ loginService called");
//   const res = await fetch("http://192.168.0.180:4000/auth/login", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ username, password }),
//   });

//   const data = await res.json();
// console.log("2️⃣ response received");
//   if (!res.ok) {
//     throw new Error(data.message || "Login failed");
//   }

//   return data;
// }