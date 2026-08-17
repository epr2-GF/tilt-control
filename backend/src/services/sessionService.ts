import fs from "fs";
import path from "path";


export type ActiveSession = {
  username: string;
  role: string;
  lastSeen: number;
  online: boolean;
};


const SESSION_FILE =
  path.join(__dirname, "../data/sessionActivity.json");


const RECENT_ACTIVITY_MS =
  24 * 60 * 60 * 1000;


const ACTIVE_SESSION_MS =
  60 * 1000;


let sessions: Record<string, ActiveSession> = {};



/* =========================================================
   LOAD SAVED SESSION ACTIVITY
   ========================================================= */

function loadSessions() {

  try {

    if (!fs.existsSync(SESSION_FILE)) {

      sessions = {};

      return;

    }


    const data =
      fs.readFileSync(
        SESSION_FILE,
        "utf8"
      );


    sessions =
      JSON.parse(data);


  } catch (error) {

    console.error(
      "Failed to load session activity",
      error
    );

    sessions = {};

  }

}



/* =========================================================
   SAVE SESSION ACTIVITY
   ========================================================= */

function saveSessions() {

  try {

    fs.writeFileSync(
      SESSION_FILE,
      JSON.stringify(
        sessions,
        null,
        2
      ),
      "utf8"
    );


  } catch (error) {

    console.error(
      "Failed to save session activity",
      error
    );

  }

}



/* =========================================================
   REMOVE ACTIVITY OLDER THAN 24 HOURS
   ========================================================= */

function cleanupOldSessions() {

  const now =
    Date.now();


  let changed = false;


  for (
    const username of Object.keys(sessions)
  ) {

    if (
      now -
      sessions[username].lastSeen >
      RECENT_ACTIVITY_MS
    ) {

      delete sessions[username];

      changed = true;

    }

  }


  if (changed) {

    saveSessions();

  }

}



/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadSessions();

cleanupOldSessions();



/* =========================================================
   UPDATE USER ACTIVITY
   ========================================================= */

export function updateSession(
  username: string,
  role: string
) {

  sessions[username] = {

    username,

    role,

    lastSeen:
      Date.now(),
    
    online: true,

  };


  saveSessions();

}



/* =========================================================
   CURRENTLY ONLINE USERS
   ========================================================= */

export function getActiveSessions() {
  cleanupOldSessions();

  return Object.values(sessions)
    .filter(session => session.online);
}



/* =========================================================
   USERS ACTIVE DURING LAST 24 HOURS
   ========================================================= */

export function getRecentSessions() {

  cleanupOldSessions();


  return Object.values(
    sessions
  )
    .sort(
      (a, b) =>
        b.lastSeen -
        a.lastSeen
    );

}

export function endSession(username: string) {
  const session = sessions[username];

  if (!session) {
    return;
  }

  session.online = false;

  saveSessions();
}