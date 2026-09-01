
import fs from "fs";
import path from "path";

export interface DeviceStatusLogEntry {
  id: number;
  entityId: string;
  state: string;
  timestamp: string;
  source: "HA" | string;
}

const dataPath = path.join(
  __dirname,
  "../data/deviceStatusLog.json"
);

/*
 * ---------------------------------------------------------
 * LOAD LOGS
 * ---------------------------------------------------------
 */

function loadLogs(): DeviceStatusLogEntry[] {

  if (!fs.existsSync(dataPath)) {

    fs.writeFileSync(
      dataPath,
      "[]"
    );

  }

  const data =
    fs.readFileSync(
      dataPath,
      "utf-8"
    );

  return JSON.parse(data);
}


/*
 * ---------------------------------------------------------
 * SAVE LOGS
 * ---------------------------------------------------------
 */

function saveLogs(
  logs: DeviceStatusLogEntry[]
) {

  fs.writeFileSync(
    dataPath,
    JSON.stringify(
      logs,
      null,
      2
    )
  );

}


/*
 * ---------------------------------------------------------
 * INITIALISE
 * ---------------------------------------------------------
 */

let logs:
  DeviceStatusLogEntry[] =
  loadLogs();


let nextId =
  logs.length > 0
    ? Math.max(
        ...logs.map(
          log => log.id ?? 0
        )
      ) + 1
    : 1;


/*
 * ---------------------------------------------------------
 * ADD DEVICE STATUS LOG
 * ---------------------------------------------------------
 */

export function addDeviceStatusLog(
  entityId: string,
  state: string,
  source: string
): DeviceStatusLogEntry {

  const now =
    new Date();


  const entry:
    DeviceStatusLogEntry = {

    id:
      nextId++,

    entityId,

    state,

    timestamp:
      now.toISOString(),

    source,

  };


  logs.push(entry);


  /*
   * -------------------------------------------------------
   * KEEP ONLY THE LAST 72 HOURS
   * -------------------------------------------------------
   */

  const cutoff =
    now.getTime() -
    72 * 60 * 60 * 1000;


  logs =
    logs.filter(
      log =>
        new Date(
          log.timestamp
        ).getTime() > cutoff
    );


  /*
   * Save the cleaned log.
   */

  saveLogs(logs);


  return entry;

}


/*
 * ---------------------------------------------------------
 * GET LOGS FOR ONE ENTITY
 * ---------------------------------------------------------
 */

export function getDeviceStatusLogs(
  entityId: string
): DeviceStatusLogEntry[] {

  return logs

    .filter(
      log =>
        log.entityId === entityId
    )

    .sort(
      (a, b) =>
        new Date(
          b.timestamp
        ).getTime() -
        new Date(
          a.timestamp
        ).getTime()
    );

}


/*
 * ---------------------------------------------------------
 * GET ALL DEVICE STATUS LOGS
 * ---------------------------------------------------------
 */

export function getAllDeviceStatusLogs():
  DeviceStatusLogEntry[] {

  return [...logs].sort(
    (a, b) =>
      new Date(
        b.timestamp
      ).getTime() -
      new Date(
        a.timestamp
      ).getTime()
  );

}
/*
 * ---------------------------------------------------------
 * DELETE ONE DEVICE STATUS LOG ENTRY
 * ---------------------------------------------------------
 */

export function deleteDeviceStatusLog(
  id: number
): boolean {

  const index =
    logs.findIndex(
      log => log.id === id
    );

  if (index === -1) {
    return false;
  }

  logs.splice(index, 1);

  saveLogs(logs);

  return true;
}


