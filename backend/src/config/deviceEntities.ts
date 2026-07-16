export const DEVICE_ENTITIES = {

  gate: {
    command: "input_boolean.fakegate",
    status: "binary_sensor.gate_status",
  },

  warehouseDoor: {
    command: "input_boolean.fakedoor",
    status: "binary_sensor.warehouse_door_status",
  },

  outsideLights: {
    command: "light.outside_lights",
    status: "light.outside_lights",
  },

  siteLights: {
    command: "input_boolean.fakesitelights",
    status: "binary_sensor.site_lights_status",
  },

  salleLights: {
    command: "input_boolean.fakesallelights",
    status: "input_boolean.fakesallelights",
  },

  garageDoor: {
    command: "cover.garage_porte_tilt",
    status: "cover.garage_porte_tilt",
  },

};