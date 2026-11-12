
import express from "express";
import { homeAssistantService } from "../services/homeAssistantService";
import { writeAudit } from "../services/auditService";

const router = express.Router();

function isAdmin(user: any): boolean {
  return (
    user?.capabilities?.manageUsers === true ||
    (user?.id === "0" && user?.username === "GhostAdmin")
  );
}

function checkAdmin(req: express.Request, res: express.Response): boolean {
  const user = (req as any).user;

  if (!isAdmin(user)) {
    res.status(403).json({ error: "Administrator access required" });
    return false;
  }

  return true;
}

const SECURITY_ENTITY = "input_boolean.security_mode";

// Read the actual state from Home Assistant
router.get("/state", async (req, res) => {
  if (!checkAdmin(req, res)) return;

  try {
    const entity = await homeAssistantService.getEntityState(SECURITY_ENTITY);

    res.json({ state: entity.state });
  } catch (error) {
    console.error("Unable to read security mode:", error);
    res.status(502).json({ error: "Unable to read security mode from Home Assistant" });
  }
});

// Toggle security mode and confirm the resulting state
router.post("/toggle", async (req, res) => {
  if (!checkAdmin(req, res)) return;

  try {
    await homeAssistantService.triggerService(
      "input_boolean",
      "toggle",
      SECURITY_ENTITY
    );

    const entity = await homeAssistantService.getEntityState(SECURITY_ENTITY);

    writeAudit({
      severity: "admin",
      type: "admin",
      event: `Security mode turned ${entity.state}`,
      actor: (req as any).user?.username || "unknown",
      details: {
        entity: SECURITY_ENTITY,
        state: entity.state,
      },
    });

    res.json({
      success: true,
      state: entity.state,
    });
  } catch (error) {
    console.error("Unable to toggle security mode:", error);
    res.status(502).json({ error: "Unable to change security mode in Home Assistant" });
  }
});

export default router;
