import type { Role } from "@/types/user";

/* -----------------------------
   SOURCE OF TRUTH
----------------------------- */
export const rolePermissions: Record<Role, {
  zones: string[];
  controls: string[];
}> = {
  admin: {
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
    controls: [
      "camera",
      "users",
      "portail-principal",
      "porte-entrepot",
      "eclairage-exterieur",
      "eclairage-salle-des-fetes",
    ],
  },

  visiteur: {
    zones: [],
    controls: ["portail-principal"],
  },

  epr2: {
    zones: [
      "tilt",
      "epr2",
      "pecherie",
      "logement-du-lac",
      "logement-du-tilt",
      "salle-des-fetes",
    ],
    controls: ["portail-principal", "porte-entrepot", "eclairage-exterieur", "eclairage-salle-des-fetes"],
  },

  restaurant: {
    zones: ["restaurant", "exterior"],
    controls: ["portail-principal", "eclairage-exterieur"],
  },

  pecheur: {
    zones: ["pecherie", "salle-des-fetes"],
    controls: ["portail-principal", "eclairage-salle-des-fetes"],
  },
};

/* -----------------------------
   HELPERS
----------------------------- */
export function canAccessZone(role: Role, zoneId: string): boolean {
  return rolePermissions[role]?.zones.includes(zoneId) ?? false;
}

export function canUseControl(role: Role, controlId: string): boolean {
  return rolePermissions[role]?.controls.includes(controlId) ?? false;
}
