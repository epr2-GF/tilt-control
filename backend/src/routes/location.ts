
import express from "express";
import { isWithinSiteRadius } from "../services/locationService";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/test", authMiddleware, (req, res) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);

  if (
    req.query.lat === undefined ||
    req.query.lng === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res.status(400).json({
      error: "Missing or invalid lat/lng parameters",
    });
  }

  const result = isWithinSiteRadius(latitude, longitude);

  return res.json(result);
});

export default router;
