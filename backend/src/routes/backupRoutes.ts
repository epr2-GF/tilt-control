import { Router } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

import { authMiddleware } from "../middleware/authMiddleware";
import { superAdminOnly } from "../middleware/superAdminMiddleware";
import { writeAudit } from "../services/auditService";

const router = Router();

const BACKUP_ROOT = "/mnt/tilt-server-backup";
const WEEKLY_ROOT = path.join(BACKUP_ROOT, "weekly");

const BACKUP_SCRIPT = "/opt/tilt-control/scripts/tilt-backup.sh";

const RESTORE_STATE_ROOT = "/var/lib/tilt-control/restore";
const RESTORE_REQUEST_FILE =
  path.join(RESTORE_STATE_ROOT, "request");

const RESTORE_STATUS_FILE =
  path.join(RESTORE_STATE_ROOT, "status");

const RESTORE_SERVICE =
  "tilt-restore-worker.service";

const execFileAsync = promisify(execFile);

const BACKUP_NAME_REGEX =
  /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function isValidBackupName(name: string): boolean {
  return BACKUP_NAME_REGEX.test(name);
}

function ensureRestoreStateDirectory() {

  if (!fs.existsSync(RESTORE_STATE_ROOT)) {
    fs.mkdirSync(RESTORE_STATE_ROOT, {
      recursive: true,
      mode: 0o700,
    });
  }

}

function writeRestoreStatus(
  status: string,
  jobId: string,
  backup: string,
  message: string
) {

  ensureRestoreStateDirectory();

  const data = {
    status,
    job_id: jobId,
    backup,
    message,
    time: new Date().toISOString(),
  };

  const tempFile =
    `${RESTORE_STATUS_FILE}.tmp`;

  fs.writeFileSync(
    tempFile,
    JSON.stringify(data, null, 2),
    {
      encoding: "utf8",
      mode: 0o600,
    }
  );

  fs.renameSync(
    tempFile,
    RESTORE_STATUS_FILE
  );

}

function readRestoreStatus() {

  try {

    if (!fs.existsSync(RESTORE_STATUS_FILE)) {
      return {
        status: "idle",
      };
    }

    return JSON.parse(
      fs.readFileSync(
        RESTORE_STATUS_FILE,
        "utf8"
      )
    );

  } catch {

    return {
      status: "unknown",
      message: "Unable to read restore status",
    };

  }

}

// --------------------------------------------------
// LIST BACKUPS
// --------------------------------------------------

router.get(
  "/list",
  authMiddleware,
  superAdminOnly,
  (req, res) => {

    try {

      if (!fs.existsSync(WEEKLY_ROOT)) {
        return res.json([]);
      }

      const entries = fs
        .readdirSync(WEEKLY_ROOT, {
          withFileTypes: true,
        })
        .filter(
          entry =>
            entry.isDirectory() &&
            isValidBackupName(entry.name)
        );

      const backups = entries
        .map(entry => {

          const name = entry.name;

          const backupPath =
            path.join(
              WEEKLY_ROOT,
              name
            );

          const manifestPath =
            path.join(
              backupPath,
              "manifest.json"
            );

          const checksumPath =
            path.join(
              backupPath,
              "SHA256SUMS"
            );

          let manifest: any = null;

          try {

            if (fs.existsSync(manifestPath)) {

              manifest = JSON.parse(
                fs.readFileSync(
                  manifestPath,
                  "utf8"
                )
              );

            }

          } catch {

            manifest = null;

          }

          return {
            name,
            timestamp:
              manifest?.backup_timestamp ??
              name,
            hostname:
              manifest?.hostname ??
              null,
            valid:
              fs.existsSync(manifestPath) &&
              fs.existsSync(checksumPath),
          };

        })
        .sort(
          (a, b) =>
            b.name.localeCompare(a.name)
        );

      return res.json(backups);

    } catch (err) {

      console.error(
        "Backup list error:",
        err
      );

      return res.status(500).json({
        message:
          "Unable to list backups",
      });

    }

  }
);

// --------------------------------------------------
// RUN BACKUP NOW
// --------------------------------------------------

router.post(
  "/run",
  authMiddleware,
  superAdminOnly,
  async (req, res) => {

    try {

      const { stdout, stderr } =
        await execFileAsync(
          BACKUP_SCRIPT,
          [],
          {
            timeout:
              10 * 60 * 1000,
            maxBuffer:
              2 * 1024 * 1024,
          }
        );

      writeAudit({
        severity: "admin",
        type: "admin",
        event:
          "Application backup completed",
        actor:
          (req as any).user?.username,
        role:
          (req as any).user?.role,
      });

      return res.json({
        success: true,
        stdout,
        warning:
          stderr || undefined,
      });

    } catch (err: any) {

      console.error(
        "Backup execution error:",
        err
      );

      writeAudit({
        severity: "error",
        type: "admin",
        event:
          "Application backup failed",
        actor:
          (req as any).user?.username,
        role:
          (req as any).user?.role,
        details:
          err?.message ??
          "Unknown error",
      });

      return res.status(500).json({
        success: false,
        message:
          "Backup failed",
        error:
          err?.message ??
          "Unknown error",
      });

    }

  }
);

// --------------------------------------------------
// RESTORE STATUS
// --------------------------------------------------

router.get(
  "/restore/status",
  authMiddleware,
  superAdminOnly,
  (req, res) => {

    return res.json(
      readRestoreStatus()
    );

  }
);

// --------------------------------------------------
// QUEUE RESTORE
// --------------------------------------------------

router.post(
  "/restore",
  authMiddleware,
  superAdminOnly,
  async (req, res) => {

    try {

      const backup =
        String(
          req.body?.backup ??
          ""
        );

      if (!isValidBackupName(backup)) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid backup identifier",
        });

      }

      const backupPath =
        path.resolve(
          WEEKLY_ROOT,
          backup
        );

      const weeklyRootResolved =
        path.resolve(
          WEEKLY_ROOT
        );

      if (
        path.dirname(backupPath) !==
        weeklyRootResolved
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid backup path",
        });

      }

      if (
        !fs.existsSync(backupPath) ||
        !fs.statSync(backupPath).isDirectory()
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Backup not found",
        });

      }

      if (
        !fs.existsSync(
          path.join(
            backupPath,
            "SHA256SUMS"
          )
        ) ||
        !fs.existsSync(
          path.join(
            backupPath,
            "manifest.json"
          )
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Backup is incomplete",
        });

      }

      ensureRestoreStateDirectory();

      // Check whether the worker is already running.
      try {

        await execFileAsync(
          "/usr/bin/systemctl",
          [
            "is-active",
            "--quiet",
            RESTORE_SERVICE,
          ]
        );

        return res.status(409).json({
          success: false,
          message:
            "A restore operation is already running",
        });

      } catch {
        // Non-zero means the service is not active.
      }

      if (
        fs.existsSync(
          RESTORE_REQUEST_FILE
        )
      ) {

        return res.status(409).json({
          success: false,
          message:
            "A restore operation is already queued",
        });

      }

      const jobId =
        crypto.randomUUID();

      const actor =
  String(
    (req as any).user?.username ??
    "unknown"
  ).replace(/[\r\n]/g, "");

const requestData =
  [
    `job_id=${jobId}`,
    `backup=${backup}`,
    `actor=${actor}`,
  ].join("\n") +
  "\n";

      const tempRequest =
        `${RESTORE_REQUEST_FILE}.tmp`;

      fs.writeFileSync(
        tempRequest,
        requestData,
        {
          encoding: "utf8",
          mode: 0o600,
        }
      );

      fs.renameSync(
        tempRequest,
        RESTORE_REQUEST_FILE
      );

      writeRestoreStatus(
        "queued",
        jobId,
        backup,
        "Restore operation queued"
      );

      writeAudit({
        severity: "admin",
        type: "admin",
        event:
          "Application restore requested",
        actor:
          (req as any).user?.username,
        role:
          (req as any).user?.role,
        details: {
          backup,
          jobId,
        },
      });

      try {

        await execFileAsync(
          "/usr/bin/systemctl",
          [
            "start",
            "--no-block",
            RESTORE_SERVICE,
          ]
        );

      } catch (startError: any) {

        fs.rmSync(
          RESTORE_REQUEST_FILE,
          {
            force: true,
          }
        );

        writeRestoreStatus(
          "failed",
          jobId,
          backup,
          "Unable to start restore worker"
        );

        console.error(
          "Restore worker start error:",
          startError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to start restore worker",
        });

      }

      return res.status(202).json({
        success: true,
        job_id: jobId,
        backup,
        status: "queued",
        message:
          "Restore operation queued",
      });

    } catch (err: any) {

      console.error(
        "Restore request error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to queue restore",
      });

    }

  }
);

export default router;