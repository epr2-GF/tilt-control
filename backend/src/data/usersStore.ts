
import fs from "fs";
import path from "path";

export type UserCapabilities = {
  manageUsers?: boolean;
};

export type User = {
  id: string;
  username: string;
  password: string;
  zones: string[];
  capabilities: UserCapabilities;
  disabled?: boolean;
  accessStart?: string;
  accessEnd?: string;
  remoteAccess?: boolean;
};

const filePath = path.join(__dirname, "users.json");
const migrationMarkerPath = path.join(
  __dirname,
  "users.permissions-migrated"
);

/*
 * Keep the existing protected system account unchanged for now.
 * System identity must be checked server-side, not granted by a
 * client-provided role or capability.
 */
const SUPERADMIN: User = {
  id: "0",
  username: "GhostAdmin",
  password: "Tanneries18!",
  zones: [
    "epr2",
    "exterior",
    "logement-du-lac",
    "logement-du-tilt",
    "pecherie",
    "restaurant",
    "salle-des-fetes",
    "tilt",
  ],
  capabilities: {
    manageUsers: true,
  },
  disabled: false,
  remoteAccess: true,
};

/*
 * Legacy role mappings are used only to migrate existing records.
 * "accueil" is shared and is deliberately not stored as a user zone.
 */
const LEGACY_ZONES: Record<string, string[]> = {
  admin: [
    "epr2",
    "exterior",
    "logement-du-lac",
    "logement-du-tilt",
    "pecherie",
    "restaurant",
    "salle-des-fetes",
    "tilt",
  ],
  superadmin: [
    "epr2",
    "exterior",
    "logement-du-lac",
    "logement-du-tilt",
    "pecherie",
    "restaurant",
    "salle-des-fetes",
    "tilt",
  ],
  visiteur: [],
  epr2: ["epr2", "tilt", "pecherie"],
  restaurant: ["restaurant"],
  pecheur: ["pecherie", "salle-des-fetes"],
};

function isGhostAdmin(user: Partial<User>): boolean {
  return user.id === "0" && user.username === "GhostAdmin";
}

function ensureSuperAdmin(users: User[]): User[] {
  const existing = users.find((user) => user.id === "0");

  if (!existing) {
    console.log("System account missing - restoring GhostAdmin");
    users.unshift({ ...SUPERADMIN });
    return users;
  }

  /*
   * Do not silently trust an arbitrary account with ID 0.
   * Restore the protected account identity while preserving its
   * current password so this migration does not change credentials.
   */
  if (existing.username !== "GhostAdmin") {
    console.warn(
      "Protected account ID 0 has an unexpected username; restoring GhostAdmin identity."
    );
    existing.username = "GhostAdmin";
  }

  existing.zones = [...SUPERADMIN.zones];
  existing.capabilities = { manageUsers: true };
  existing.disabled = false;
  existing.remoteAccess = true;

  return users;
}

function migrateLegacyUsers(users: any[]): User[] {
  const markerExists = fs.existsSync(migrationMarkerPath);

  const migrated = users.map((rawUser) => {
    const user = { ...rawUser };

if (isGhostAdmin(user)) {
  const migratedGhost = {
    ...user,
    zones: [...SUPERADMIN.zones],
    capabilities: { manageUsers: true },
    disabled: false,
    remoteAccess: true,
  };

  delete migratedGhost.role;
  delete migratedGhost.permissions;

  return migratedGhost as User;
}

    /*
     * Only seed zones/capabilities when they are not already present.
     * Once a user's permissions have been explicitly assigned, legacy
     * role data must never overwrite them.
     */
    if (!Array.isArray(user.zones)) {
      user.zones = LEGACY_ZONES[user.role] ?? [];
    }

    if (
      !user.capabilities ||
      typeof user.capabilities !== "object"
    ) {
      user.capabilities = {
        manageUsers: user.role === "admin",
      };
    }

    /*
     * Preserve the existing rule that only GhostAdmin can grant
     * administrator capability. Legacy admin accounts retain it
     * during the initial migration.
     */
    if (!markerExists && user.role === "admin") {
      user.capabilities.manageUsers = true;
      user.zones = [...LEGACY_ZONES.admin];
    }

    delete user.role;
    delete user.permissions;

    return user as User;
  });

  return ensureSuperAdmin(migrated);
}

export function readUsers(): User[] {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf-8");
  }

  const data = fs.readFileSync(filePath, "utf-8");
  const parsed: any[] = JSON.parse(data);

  const users = migrateLegacyUsers(parsed);

  // Only write when migration or GhostAdmin repair changed the data.
  if (JSON.stringify(parsed) !== JSON.stringify(users)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify(users, null, 2),
      "utf-8"
    );
  }

  // Create the marker once, after the migrated data has been saved.
  if (!fs.existsSync(migrationMarkerPath)) {
    fs.writeFileSync(
      migrationMarkerPath,
      new Date().toISOString(),
      "utf-8"
    );
  }

  return users;
}

export function writeUsers(users: User[]): void {
  const protectedUsers = ensureSuperAdmin(users);

  fs.writeFileSync(
    filePath,
    JSON.stringify(protectedUsers, null, 2),
    "utf-8"
  );
}
