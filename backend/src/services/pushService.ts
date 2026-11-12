
import * as webpush from "web-push";

import {
  getVapidKeys,
  getPushSubscriptions,
  removePushSubscription,
} from "../data/pushStore";

import { readUsers } from "../data/usersStore";

const vapidKeys = getVapidKeys();

webpush.setVapidDetails(
  "mailto:admin@tilt44.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export type PushNotification = {
  title: string;
  body: string;
  url?: string;
};

function canReceiveNotifications(user: {
  id: string;
  username: string;
  disabled?: boolean;
  capabilities?: {
    receiveNotifications?: boolean;
  };
}): boolean {
  if (user.disabled === true) {
    return false;
  }

  // GhostAdmin always receives notifications.
  if (user.id === "0" && user.username === "GhostAdmin") {
    return true;
  }

  return user.capabilities?.receiveNotifications === true;
}

function isExpiredSubscriptionError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error
  ) {
    const statusCode = (error as { statusCode: number }).statusCode;
    return statusCode === 404 || statusCode === 410;
  }

  return false;
}

export async function sendPushToUser(
  userId: string,
  notification: PushNotification
) {
  const user = readUsers().find(
    (candidate) => String(candidate.id) === String(userId)
  );

  if (!user || !canReceiveNotifications(user)) {
    return {
      attempted: 0,
      successful: 0,
      failed: 0,
    };
  }

  const subscriptions = getPushSubscriptions().filter(
    (record) => record.userId === String(user.id)
  );

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url ?? "/",
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (record) => {
      try {
        await webpush.sendNotification(
          record.subscription,
          payload
        );
      } catch (error: unknown) {
        if (isExpiredSubscriptionError(error)) {
          removePushSubscription(record.subscription.endpoint);
          return;
        }

        throw error;
      }
    })
  );

  return {
    attempted: subscriptions.length,
    successful: results.filter(
      (result) => result.status === "fulfilled"
    ).length,
    failed: results.filter(
      (result) => result.status === "rejected"
    ).length,
  };
}

export async function sendPushToAll(
  notification: PushNotification
) {
  const authorisedUsers = readUsers().filter(
    canReceiveNotifications
  );

  const results = await Promise.all(
    authorisedUsers.map((user) =>
      sendPushToUser(user.id, notification)
    )
  );

  return {
    users: authorisedUsers.length,
    attempted: results.reduce(
      (total, result) => total + result.attempted,
      0
    ),
    successful: results.reduce(
      (total, result) => total + result.successful,
      0
    ),
    failed: results.reduce(
      (total, result) => total + result.failed,
      0
    ),
  };
}
