export const safeUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // fallback for older / mobile restricted environments
  return (
    "id-" +
    Date.now() +
    "-" +
    Math.random().toString(16).slice(2)
  );
};