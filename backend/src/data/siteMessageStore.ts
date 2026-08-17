import fs from "fs";
import path from "path";

const filePath = path.join(__dirname, "siteMessage.json");

export type SiteMessage = {
  message: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

const defaultMessage: SiteMessage = {
  message: "",
  updatedAt: null,
  updatedBy: null,
};

function ensureFile() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify(defaultMessage, null, 2),
      "utf-8"
    );
  }
}

export function readSiteMessage(): SiteMessage {
  ensureFile();

  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return defaultMessage;
  }
}

export function saveSiteMessage(
  message: string,
  updatedBy: string
): SiteMessage {

  const data: SiteMessage = {
    message,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf-8"
  );

  return data;
}