import { Request, Response, NextFunction } from "express";
import { readUsers } from "../data/usersStore";


export function timeAccessMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {

console.log("⏰ TIME ACCESS MIDDLEWARE HIT");

  const currentUser = (req as any).user;


  if (!currentUser) {
    return res.status(401).json({
      message:"Not authenticated"
    });
  }


  // Admin bypass
  if(currentUser.role === "admin"){
    return next();
  }


  const users = readUsers();

  const user =
    users.find(
      u => u.id === currentUser.id
    );


  if(!user){
    return res.status(401).json({
      message:"User not found"
    });
  }


  // No restrictions
  if(!user.accessStart || !user.accessEnd){
    return next();
  }


  const now =
    new Date();


  const current =
    now.getHours() * 60 +
    now.getMinutes();


  const [startH,startM] =
    user.accessStart.split(":").map(Number);

  const [endH,endM] =
    user.accessEnd.split(":").map(Number);


  const start =
    startH * 60 + startM;

  const end =
    endH * 60 + endM;


  let allowed;


  // Normal daytime period
  if(start <= end){

    allowed =
      current >= start &&
      current <= end;

  }

  // Overnight period e.g. 22:00 - 06:00
  else {

    allowed =
      current >= start ||
      current <= end;

  }


(req as any).user.timeAccessAllowed = allowed;

console.log(
  "⏰ Time access:",
  currentUser.username,
  allowed
);

next();
}