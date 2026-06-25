type AccessTimeUser = {
  role: string;
  accessStart?: string;
  accessEnd?: string;
};

export function isUserWithinAccessTime(user: AccessTimeUser): boolean {
  // 👑 ADMIN ALWAYS ALLOWED
  if (user.role === "admin") return true;

  // if no time restriction set → allow
  if (!user.accessStart || !user.accessEnd) return true;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = user.accessStart.split(":").map(Number);
  const [eh, em] = user.accessEnd.split(":").map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  return nowMinutes >= start && nowMinutes <= end;
}