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

  accessStart?: string; // "08:00"
  accessEnd?: string;   // "18:00"


};