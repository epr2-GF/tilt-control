import express from "express";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

import { authMiddleware } from "../middleware/authMiddleware";
import { superAdminOnly } from "../middleware/superAdminMiddleware";
import { writeAudit } from "../services/auditService";

const router = express.Router();

const execFileAsync = promisify(execFile);

const BACKUP_ROOT = "/mnt/tilt-server-backup";
const WEEKLY_ROOT = path.join(BACKUP_ROOT, "weekly");

const BACKUP_SCRIPT = "/opt/tilt-control/scripts/tilt-backup.sh";
const RESTORE_SCRIPT = "/opt/tilt-control/scripts/tilt-restore.sh";

const BACKUP_NAME_REGEX =
  /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;

const restoreLock = {
  running: false,
};


/*
 * GET /api/admin/backup/list
 *
 * List valid weekly backups.
 */
router.get(
  "/list",
  authMiddleware,
  superAdminOnly,
  (req, res) => {

    try {

      if (!fs.existsSync(WEEKLY_ROOT)) {
        return res.json({
          backups: [],
        });
      }

      const backups = fs.readdirSync(
        WEEKLY_ROOT,
        {
          withFileTypes: true,
        }
      )
        .filter(entry =>
          entry.isDirectory() &&
          BACKUP_NAME_REGEX.test(entry.name)
        )
        .map(entry => {

          const backupPath =
            path.join(
              WEEKLY_ROOT,
              entry.name
            );

          const manifestPath =
            path.join(
              backupPath,
              "manifest.json"
            );

          let manifest: any = null;

          try {

            manifest = JSON.parse(
              fs.readFileSync(
                manifestPath,
                "utf8"
              )
            );

          } catch {
            manifest = null;
          }

          return {
            name: entry.name,

            timestamp:
              manifest?.backup_timestamp ??
              entry.name,

            hostname:
              manifest?.hostname ??
              null,

            valid:
              fs.existsSync(
                path.join(
                  backupPath,
                  "SHA256SUMS"
                )
              ) &&
              fs.existsSync(
                manifestPath
              ),
          };

        })
        .sort((a, b) =>
          b.name.localeCompare(a.name)
        );

      return res.json({
        backups,
      });

    } catch (err) {

      console.error(
        "BACKUP LIST ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Unable to list backups",
      });

    }

  }
);


/*
 * POST /api/admin/backup/run
 *
 * Run an immediate application backup.
 */
router.post(
  "/run",
  authMiddleware,
  superAdminOnly,
  async (req, res) => {

    if (restoreLock.running) {
      return res.status(409).json({
        message:
          "A restore operation is currently running",
      });
    }

    try {

      const { stdout, stderr } =
        await execFileAsync(
          BACKUP_SCRIPT,
          [],
          {
            timeout: 10 * 60 * 1000,
            maxBuffer: 2 * 1024 * 1024,
          }
        );

      const user =
        (req as any).user;

      writeAudit({
        severity: "admin",
        type: "admin",
        event: "backup_run",
        actor: user.username,
        target: "tilt_application",
        role: user.role,
        ip: req.ip,
        action: "backup",
        details: {
          result: "success",
        },
      });

      return res.json({
        ok: true,
        output: stdout,
        warning: stderr || null,
      });

    } catch (err: any) {

      console.error(
        "BACKUP RUN ERROR:",
        err
      );

      const user =
        (req as any).user;

      writeAudit({
        severity: "error",
        type: "admin",
        event: "backup_run_failed",
        actor: user.username,
        target: "tilt_application",
        role: user.role,
        ip: req.ip,
        action: "backup",
        details: {
          result: "failed",
          error:
            err?.message ??
            "Unknown error",
        },
      });

      return res.status(500).json({
        ok: false,
        message:
          "Backup failed",
        error:
          err?.message ??
          "Unknown error",
      });

    }

  }
);


/*
 * POST /api/admin/backup/restore
 *
 * Restore a selected weekly backup.
 *
 * IMPORTANT:
 * The client supplies only a backup NAME.
 * The filesystem path is constructed here.
 */
router.post(
  "/restore",
  authMiddleware,
  superAdminOnly,
  async (req, res) => {

    if (restoreLock.running) {
      return res.status(409).json({
        message:
          "A restore operation is already running",
      });
    }

    const backup =
      req.body?.backup;

    if (
      typeof backup !== "string" ||
      !BACKUP_NAME_REGEX.test(backup)
    ) {
      return res.status(400).json({
        message:
          "Invalid backup identifier",
      });
    }

    const backupPath =
      path.join(
        WEEKLY_ROOT,
        backup
      );

    /*
     * Defensive path check.
     */
    if (
      path.dirname(backupPath) !==
      WEEKLY_ROOT
    ) {
      return res.status(400).json({
        message:
          "Invalid backup path",
      });
    }

    /*
     * Verify that the selected backup exists.
     */
    if (
      !fs.existsSync(backupPath) ||
      !fs.statSync(backupPath).isDirectory()
    ) {
      return res.status(404).json({
        message:
          "Backup not found",
      });
    }

    const checksumFile =
      path.join(
        backupPath,
        "SHA256SUMS"
      );

    const manifestFile =
      path.join(
        backupPath,
        "manifest.json"
      );

    if (
      !fs.existsSync(checksumFile) ||
      !fs.existsSync(manifestFile)
    ) {
      return res.status(400).json({
        message:
          "Backup is incomplete",
      });
    }

    restoreLock.running = true;

    const user =
      (req as any).user;

    writeAudit({
      severity: "warning",
      type: "admin",
      event: "backup_restore_started",
      actor: user.username,
      target: backup,
      role: user.role,
      ip: req.ip,
      action: "restore",
      details: {
        backup,
      },
    });

    try {

      const { stdout, stderr } =
        await execFileAsync(
          RESTORE_SCRIPT,
          [backupPath],
          {
            timeout: 10 * 60 * 1000,
            maxBuffer: 4 * 1024 * 1024,
          }
        );

      writeAudit({
        severity: "admin",
        type: "admin",
        event: "backup_restore_completed",
        actor: user.username,
        target: backup,
        role: user.role,
        ip: req.ip,
        action: "restore",
        details: {
          backup,
          result: "success",
        },
      });

      return res.json({
        ok: true,
        backup,
        output: stdout,
        warning: stderr || null,
      });

    } catch (err: any) {

      console.error(
        "BACKUP RESTORE ERROR:",
        err
      );

      writeAudit({
        severity: "error",
        type: "admin",
        event: "backup_restore_failed",
        actor: user.username,
        target: backup,
        role: user.role,
        ip: req.ip,
        action: "restore",
        details: {
          backup,
          result: "failed",
          error:
            err?.message ??
            "Unknown error",
        },
      });

      return res.status(500).json({
        ok: false,
        message:
          "Restore failed",
        error:
          err?.message ??
          "Unknown error",
      });

    } finally {

      restoreLock.running = false;

    }

  }
);


export default router;
