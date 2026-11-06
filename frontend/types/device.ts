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

  humidityEntity?: string;
  
  setpointEntity?: string;

  enabled: boolean;

  sortOrder: number;
}