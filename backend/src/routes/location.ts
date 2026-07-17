import express from "express";
import { isWithinSiteRadius } from "../services/locationService";

const router = express.Router();

router.get("/test", (req, res) => {

  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return res.status(400).json({
      error: "Missing or invalid lat/lng parameters",
    });
  }

  const result = isWithinSiteRadius(
    latitude,
    longitude
  );

  return res.json(result);

});

export default router;