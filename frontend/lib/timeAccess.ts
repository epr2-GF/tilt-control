
type AccessTimeUser = {
  id?: string;
  username?: string;
  capabilities?: {
    manageUsers?: boolean;
  };
  accessStart?: string;
  accessEnd?: string;
};

export function isUserWithinAccessTime(user: AccessTimeUser): boolean {
  // GhostAdmin and user-management administrators are always allowed.
  if (
    (user.id === "0" && user.username === "GhostAdmin") ||
    user.capabilities?.manageUsers === true
  ) {
    return true;
  }

  // If no time restriction is set, allow access.
  if (!user.accessStart || !user.accessEnd) return true;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = user.accessStart.split(":").map(Number);
  const [eh, em] = user.accessEnd.split(":").map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  // Support both daytime and overnight access windows.
  if (start <= end) {
    return nowMinutes >= start && nowMinutes <= end;
  }

  return nowMinutes >= start || nowMinutes <= end;
}
