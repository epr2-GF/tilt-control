import fs from "fs";
import path from "path";


const LOG_FILE =
  path.join(__dirname,"../data/auditlog.json");


interface AuditEntry {
  time: string;

  severity: "info" | "warning" | "error" | "admin";

  event: string;

  actor?: string;

  target?: string;

  details?: Record<string, unknown> | string;

  role?: string;

  ip?: string;
}



function ensureFile(){

  if(!fs.existsSync(LOG_FILE)){

    fs.writeFileSync(
      LOG_FILE,
      JSON.stringify([],null,2)
    );

  }

}



export function writeAudit(
  entry: Omit<AuditEntry,"time">
){

  ensureFile();


  const logs:AuditEntry[] =
    JSON.parse(
      fs.readFileSync(LOG_FILE,"utf8")
    );


  const now =
    new Date();


  logs.push({

    time:now.toISOString(),

    ...entry

  });



  const cutoff =
    now.getTime()
    -
    (72 * 60 * 60 * 1000);



  const filtered =
    logs.filter(
      log =>
      new Date(log.time).getTime()
      >
      cutoff
    );


  fs.writeFileSync(
    LOG_FILE,
    JSON.stringify(filtered,null,2)
  );

}