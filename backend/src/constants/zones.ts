export const ZONES = [
  "Tilt",
  "Salle des Fêtes",
  "EPR2",
  "Restaurant",
  "Extérieur",
  "Pêcherie",
  "Logement du Lac",
  "Logement du Tilt",
] as const;

export type ZoneName = typeof ZONES[number];