import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/userRoutes";
import deviceRoutes from "./routes/deviceRoutes"; 
import { authMiddleware } from "./middleware/authMiddleware";
import { initHomeAssistantStream } from "./services/haStreamService"; 
import locationRoutes from "./routes/location";
import adminRoutes from "./routes/adminRoutes";
import statusRoutes from "./routes/statusRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import deviceAdminRoutes from "./routes/deviceAdminRoutes";
import { readUsers } from "./data/usersStore";

const app = express();


// 🔐 Ensure protected superadmin exists
readUsers();


app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://tilt44.com",
  "https://www.tilt44.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // mobile / curl / server-to-server

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("❌ CORS blocked:", origin);

      // IMPORTANT: DO NOT THROW ERROR
      return callback(null, false);
    },
    credentials: true,
  })
);


// ✅ 1. MIDDLEWARE FIRST (VERY IMPORTANT)
app.use(express.json());

// ✅ 2. ROUTES
app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl);
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/devices", authMiddleware, deviceRoutes); // Protect ALL device routes with your JWT middleware
app.use("/api/location", locationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/session", authMiddleware, sessionRoutes);
app.use(
  "/api/admin/devices",
  authMiddleware,
  deviceAdminRoutes
);

app.post("/api/test-session", (req, res) => {
  console.log("🔥 test session route hit");

  res.json({
    ok: true
  });
});

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