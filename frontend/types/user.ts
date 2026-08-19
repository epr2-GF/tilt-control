export type Role =
  | "superadmin"
  | "admin"
  | "visiteur"
  | "epr2"
  | "restaurant"
  | "pecheur";

export type UserPermissions = {
  zones: string[];
  controls: string[];
};

export type User = {
  id: string;
  username: string;
  password?: string;

  role: Role;
  disabled: boolean;

  accessStart?: string;
  accessEnd?: string;
  remoteAccess?: boolean;

  permissions?: UserPermissions;
};