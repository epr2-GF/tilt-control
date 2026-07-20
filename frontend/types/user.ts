export type Role =
  | "admin"
  | "visiteur"
  | "epr2"
  | "restaurant"
  | "pecheur";

export type User = {
  id: string;
  username: string;
  password?: string;
  role: Role;
  disabled: boolean;

  accessStart?: string;
  accessEnd?: string;
  remoteAccess?: boolean;

  permissions?: {
    zones: string[];
    controls: string[];
  };
};