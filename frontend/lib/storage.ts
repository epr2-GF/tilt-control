const USERS_KEY = "smart-site-users";
const SESSION_KEY = "smart-site-user";

// USERS

export function getUsersStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const data = localStorage.getItem(USERS_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("getUsersStorage error:", error);
    return [];
  }
}

export function saveUsersStorage(users: any[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify(users)
    );
  } catch (error) {
    console.error("saveUsersStorage error:", error);
  }
}

// SESSION

export function getSessionUser() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const data = localStorage.getItem(SESSION_KEY);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
}

export function setSessionUser(user: any) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(user)
    );
  } catch (error) {
    console.error("setSessionUser error:", error);
  }
}

export function clearSessionUser() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("clearSessionUser error:", error);
  }
}