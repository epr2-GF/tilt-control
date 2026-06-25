import fs from "fs";
import path from "path";

export type User = {
  id: string;
  username: string;
  password: string;
  role: string;
  disabled?: boolean;
  accessStart?: string;
  accessEnd?: string;
};

const filePath = path.join(__dirname, "users.json");

// READ users
export function readUsers(): User[] {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// WRITE users
export function writeUsers(users: User[]) {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}