import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { updateSession } from "../services/sessionService";


const router = express.Router();

console.log("✅ sessionRoutes loaded");

router.post(
  "/heartbeat",
  authMiddleware,
  (req,res)=>{

    const user = (req as any).user;


    if(user){

      updateSession(
        user.username,
        user.role
      );

    }


    res.json({
      success:true
    });

  }
);


export default router;