import { Request, Response, NextFunction } from "express";


export function superAdminOnly(
 req:Request,
 res:Response,
 next:NextFunction
){

 const user=(req as any).user;


if(
   !user ||
   Number(user.id) !== 0 ||
   user.role !== "superadmin"
)
 {

   return res.status(403).json({
     message:"Superadmin required"
   });

 }


 next();

}