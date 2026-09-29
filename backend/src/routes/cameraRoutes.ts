import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/gate",
  authMiddleware,
  async (req, res) => {

    const user = (req as any).user;

    /*
     * Camera is restricted to admin and superadmin.
     */
    if (
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    try {

      const haUrl =
        process.env.HA_URL;

      const haToken =
        process.env.HA_TOKEN;

      if (!haUrl || !haToken) {

        console.error(
          "HA_URL or HA_TOKEN is not configured"
        );

        return res.status(500).json({
          message:
            "Home Assistant configuration unavailable",
        });

      }

      /*
       * Ask Home Assistant for a fresh camera image.
       */
      const response = await fetch(
        `${haUrl}/api/camera_proxy/camera.portail_fluide`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${haToken}`,

            Accept: "image/jpeg",
          },

          cache: "no-store",
        }
      );

      if (!response.ok) {

        console.error(
          "Home Assistant camera request failed:",
          response.status,
          response.statusText
        );

        return res.status(502).json({
          message:
            "Impossible de récupérer l'image du portail",
        });

      }

      const image =
        Buffer.from(
          await response.arrayBuffer()
        );

      res.setHeader(
        "Content-Type",
        response.headers.get(
          "content-type"
        ) || "image/jpeg"
      );

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );

      res.setHeader(
        "Pragma",
        "no-cache"
      );

      res.setHeader(
        "Expires",
        "0"
      );

      return res.send(image);

    } catch (error) {

      console.error(
        "Failed to capture gate camera:",
        error
      );

      return res.status(502).json({
        message:
          "Impossible de contacter Home Assistant",
      });

    }
  }
);

export default router;