import fs from "fs";
import path from "path";


const LOG_FILE =
  path.join(__dirname, "../data/auditLog.json");


export type AuditEntry = {

  time: string;

  severity:
    | "info"
    | "warning"
    | "error"
    | "admin";

  type?:
    | "login"
    | "device_control"
    | "admin";

  event: string;

  actor?: string;

  target?: string;

  details?:
    Record<string, unknown> | string;

  role?: string;

  ip?: string;

  device?: string;

  action?: string;

};


function ensureFile() {

  if (!fs.existsSync(LOG_FILE)) {

    fs.writeFileSync(
      LOG_FILE,
      JSON.stringify([], null, 2),
      "utf8"
    );

  }

}


export function writeAudit(
  entry: Omit<AuditEntry, "time">
) {

  ensureFile();


  let logs: AuditEntry[] = [];


  try {

    logs = JSON.parse(
      fs.readFileSync(
        LOG_FILE,
        "utf8"
      )
    );

  } catch {

    logs = [];

  }


  const now =
    new Date();


  logs.push({

    time:
      now.toISOString(),

    ...entry,

  });


  /*
    Keep only the last 72 hours
  */

  const cutoff =
    now.getTime() -
    72 * 60 * 60 * 1000;


  logs =
    logs.filter(
      log =>
        new Date(
          log.time
        ).getTime() > cutoff
    );


  fs.writeFileSync(

    LOG_FILE,

    JSON.stringify(
      logs,
      null,
      2
    ),

    "utf8"

  );

}