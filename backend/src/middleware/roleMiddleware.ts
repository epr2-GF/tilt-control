import type { Request, Response, NextFunction } from "express";

const roleHierarchy: Record<string, string[]> = {
  superadmin: [
    "superadmin",
    "admin",
    "visiteur",
    "epr2",
    "restaurant",
    "pecheur",
  ],

  admin: [
    "admin",
    "visiteur",
    "epr2",
    "restaurant",
    "pecheur",
  ],

  visiteur: [
    "visiteur",
  ],

  epr2: [
    "epr2",
  ],

  restaurant: [
    "restaurant",
  ],

  pecheur: [
    "pecheur",
  ],
};


export function roleMiddleware(allowedRoles: string[]) {

  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    const user = (req as any).user;


    if (!user) {
      return res.status(401).json({
        message:"Not authenticated"
      });
    }


    const userRoles =
      roleHierarchy[user.role] || [];


    const hasPermission =
      allowedRoles.some(
        role => userRoles.includes(role)
      );


    if (!hasPermission) {

      return res.status(403).json({
        message:"Forbidden (role)"
      });

    }


    next();

  };

}