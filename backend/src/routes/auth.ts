import express from "express";
import jwt from "jsonwebtoken";
import { readUsers } from "../data/usersStore";
import { JWT_SECRET } from "../config/jwt";
import { authMiddleware } from "../middleware/authMiddleware";
import { ROLE_PERMISSIONS } from "../config/rolePermissions";
import { writeAudit } from "../services/auditService";
import { SUPER_ADMIN } from "../config/superAdmin";

const router = express.Router();

/* -----------------------------
   LOGIN
----------------------------- */
router.post("/login", (req, res) => {
  const { username, password } = req.body;

// HARD CODED SUPER ADMIN
if(
 username === SUPER_ADMIN.username &&
 password === SUPER_ADMIN.password
){

const token = jwt.sign(
{
 id: SUPER_ADMIN.id,
 username: SUPER_ADMIN.username,
 role: SUPER_ADMIN.role,
},
JWT_SECRET,
{
 expiresIn:"7d"
}
);


writeAudit({
 severity:"info",
 event:"SUPERADMIN_LOGIN",
 actor:SUPER_ADMIN.username
});


return res.json({
 user:{
   id:SUPER_ADMIN.id,
   username:SUPER_ADMIN.username,
   role:SUPER_ADMIN.role,
   permissions:{
      zones:[
        "tilt",
        "epr2",
        "restaurant",
        "salle-des-fetes",
        "pecherie",
        "exterior",
        "logement-du-lac",
        "logement-du-tilt"
      ]
   }
 },
 token
});

}

  const users = readUsers();

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

if (!user) {

writeAudit({
  severity: "warning",
  event: "LOGIN_FAILED",
  actor: username,
});

  return res.status(401).json({
      message: "Identifiants invalides",
    });
  }

if (user.disabled) {

  writeAudit({
    severity: "warning",
    event: "LOGIN_DISABLED_ACCOUNT",
    actor: username,
  });

  return res.status(403).json({
    message: "Compte désactivé",
  });
}

const token = jwt.sign(
  {
    id: user.id,
    username: user.username,
    role: user.role,
  },
  JWT_SECRET,
  { expiresIn: "7d" }
);

writeAudit({
  severity: "info",
  event: "LOGIN_SUCCESS",
  actor: user.username,
  role: user.role,
});

return res.json({
  user: {
    id: user.id,
    username: user.username,
    role: user.role,
  },
  token,
});
});

router.get("/me", authMiddleware, (req, res) => {

  const users = readUsers();
  const currentUser = (req as any).user;

 const user = users.find(
  u => String(u.id) === String(currentUser.id)
);

  if (!user) {
    return res.status(404).json({ 
      message: "Utilisateur introuvable" 
    });
  }

  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    disabled: user.disabled,
    accessStart: user.accessStart,
    accessEnd: user.accessEnd,
    remoteAccess: user.remoteAccess,

    permissions:
      ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS]
  });
});

export default router;