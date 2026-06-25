export const ROLE_PERMISSIONS = {
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
    controls: [
      "portail-principal",
    ],
  },

  epr2: {
    zones: [
      "epr2",
      "tilt",
      "pecherie",
    ],
    controls: [
      "portail-principal",
      "porte-entrepot",
      "eclairage-exterieur",
      "eclairage-salle-des-fetes",
    ],
  },

  restaurant: {
    zones: [
      "restaurant",
    ],
    controls: [
      "portail-principal",
      "eclairage-exterieur",
    ],
  },

  pecheur: {
    zones: [
      "pecherie",
      "salle-des-fetes",
    ],
    controls: [
      "portail-principal",
      "eclairage-salle-des-fetes",
    ],
  },
};