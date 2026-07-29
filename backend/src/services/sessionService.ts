type ActiveSession = {
  username: string;
  role: string;
  lastSeen: number;
};


const activeSessions: Record<string, ActiveSession> = {};


export function updateSession(
  username: string,
  role: string
) {

  activeSessions[username] = {

    username,

    role,

    lastSeen: Date.now()

  };

}



export function getActiveSessions() {

  const now = Date.now();


  return Object.values(activeSessions)
    .filter(
      session =>
        now - session.lastSeen < 60000
    );

}