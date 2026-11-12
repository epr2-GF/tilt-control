
import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as webpush from "web-push";

export type PushSubscriptionRecord = {
  userId: string;
  subscription: webpush.PushSubscription;
  createdAt: string;
};

type VapidKeys = {
  publicKey: string;
  privateKey: string;
};

type PushSecrets = {
  homeAssistantSecret: string;
};

const dataDirectory = __dirname;

const vapidFile = path.join(dataDirectory, "vapid.json");
const secretsFile = path.join(dataDirectory, "pushSecrets.json");
const subscriptionsFile = path.join(
  dataDirectory,
  "pushSubscriptions.json"
);

function ensureDataDirectory() {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    console.error(`Unable to read ${path.basename(filePath)}:`, error);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T) {
  ensureDataDirectory();

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

export function getVapidKeys(): VapidKeys {
  ensureDataDirectory();

  if (fs.existsSync(vapidFile)) {
    const existing = readJsonFile<VapidKeys>(vapidFile, {
      publicKey: "",
      privateKey: "",
    });

    if (existing.publicKey && existing.privateKey) {
      return existing;
    }

    throw new Error("Stored VAPID keys are invalid.");
  }

  const keys = webpush.generateVAPIDKeys();

  const vapidKeys: VapidKeys = {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };

  writeJsonFile(vapidFile, vapidKeys);

  console.log("Web Push VAPID keys generated.");

  return vapidKeys;
}

export function getVapidPublicKey(): string {
  return getVapidKeys().publicKey;
}

export function getHomeAssistantSecret(): string {
  ensureDataDirectory();

  const existing = readJsonFile<PushSecrets | null>(
    secretsFile,
    null
  );

  if (existing?.homeAssistantSecret) {
    return existing.homeAssistantSecret;
  }

  const secret = crypto.randomBytes(32).toString("hex");

  writeJsonFile(secretsFile, {
    homeAssistantSecret: secret,
  });

  console.log("Home Assistant notification secret generated.");

  return secret;
}

export function getPushSubscriptions(): PushSubscriptionRecord[] {
  return readJsonFile<PushSubscriptionRecord[]>(
    subscriptionsFile,
    []
  );
}

export function savePushSubscription(
  userId: string,
  subscription: webpush.PushSubscription
) {
  if (!userId || !subscription.endpoint) {
    throw new Error("Invalid push subscription.");
  }

  const subscriptions = getPushSubscriptions();

  const updatedSubscriptions = subscriptions.filter(
    (record) =>
      record.subscription.endpoint !== subscription.endpoint
  );

  updatedSubscriptions.push({
    userId,
    subscription,
    createdAt: new Date().toISOString(),
  });

  writeJsonFile(subscriptionsFile, updatedSubscriptions);
}

export function removePushSubscription(endpoint: string) {
  const subscriptions = getPushSubscriptions();

  const updatedSubscriptions = subscriptions.filter(
    (record) => record.subscription.endpoint !== endpoint
  );

  writeJsonFile(subscriptionsFile, updatedSubscriptions);
}

