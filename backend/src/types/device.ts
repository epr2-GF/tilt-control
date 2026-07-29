export interface Device {

  id?: number;

  name: string;

  description?: string;

  entityId: string;

  statusEntity?: string;

  cardType:
    | "device"
    | "binary"
    | "rollerShutter"
    | "sensor";

  statusTrue?: string;

  statusFalse?: string;

  zones: string[];

  icon: string;

  enabled: boolean;

  sortOrder: number;

}