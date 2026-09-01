export interface Device {

  id?: number;

  name: string;

  description?: string;

  entityId: string;

  statusEntity?: string;

  /*
   * Optional entities used by the On / Off card.
   *
   * button1Entity = entity controlled by the green / ON button
   * button2Entity = entity controlled by the red / OFF button
   */
  button1Entity?: string;

  button2Entity?: string;

cardType:
  | "device"
  | "binary"
  | "rollerShutter"
  | "sensor"
  | "onOff"
  | "lock"
  | "minilog";

  statusTrue?: string;

  statusFalse?: string;

  zones: string[];

  icon: string;

  enabled: boolean;

  sortOrder: number;

  miniLogMode?: "normal" | "pulse";

  miniLogPulseSeconds?: number;

}