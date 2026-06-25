import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/userRoutes";
import deviceRoutes from "./routes/deviceRoutes"; 
import { authMiddleware } from "./middleware/authMiddleware";
import { initHomeAssistantStream } from "./services/haStreamService"; // 🔌 Stream handler imported here

const app = express();

// ✅ 1. MIDDLEWARE FIRST (VERY IMPORTANT)
app.use(cors());
app.use(express.json());

// ✅ 2. ROUTES
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/devices", authMiddleware, deviceRoutes); // Protect ALL device routes with your JWT middleware

// ✅ TEST ROUTE
app.get("/api/test-protected", authMiddleware, (req, res) => {
  res.json({
    message: "JWT is working 🎉",
    user: (req as any).user,
  });
});

// health check
app.get("/health", (req, res) => {
  res.json({ status: "backend running 🚀" });
});

const PORT = 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://192.168.0.180:${PORT}`);
  
  // ✅ Initialize the persistent cloud connection once the server boots
  initHomeAssistantStream(); 
});