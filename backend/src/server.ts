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

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://tilt44.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


// ✅ 1. MIDDLEWARE FIRST (VERY IMPORTANT)
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
  // Use a relative or generic log message
  console.log(`Backend running on port 4000`);
  
  // ✅ Initialize the persistent cloud connection once the server boots
  initHomeAssistantStream(); 
});