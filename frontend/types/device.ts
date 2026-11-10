
export interface Device {
  id: number;
  name: string;
  description: string;
  entityId: string;

  cardType:
    | "device"
    | "binary"
    | "rollerShutter"
    | "sensor"
    | "onOff"
    | "lock"
    | "minilog"
    | "dimmer"
    | "runScript"
    | "thermostat"
    | "weather";

  zones: string[];
  icon: string;

  humidityEntity?: string;
  setpointEntity?: string;

  // Weather station sensors
  weatherHumidityEntity?: string;
  weatherPrecipitationEntity?: string;
  weatherWindSpeedEntity?: string;
  weatherWindGustEntity?: string;
  weatherLightEntity?: string;

  statusEntity?: string;
  button1Entity?: string;
  button2Entity?: string;
  statusTrue?: string;
  statusFalse?: string;

  miniLogMode?: "normal" | "pulse";
  miniLogPulseSeconds?: number;

  enabled: boolean;
  sortOrder: number;
}
