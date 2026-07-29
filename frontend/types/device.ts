export interface Device {

  id: number;

  name: string;

  description: string;

  entityId: string;

  cardType:
    | "device"
    | "binary"
    | "rollerShutter"
    | "sensor";

  zones: string[];

  icon: string;

  enabled: boolean;

  sortOrder: number;
}