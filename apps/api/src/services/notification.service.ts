import Expo, { type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { prisma, NotificationType } from "@mintfeed/db";

const expo = new Expo();

const DAILY_CAP = 3;
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

const ANDROID_CHANNEL_IDS: Record<NotificationType, string> = {
  BREAKING_NEWS: "breaking-news",
  MARKET_MOVER: "market-movers",
  PREDICTION_SETTLED: "settlements",
};

// ─── Throttling ───

function getDeviceLocalHour(timezoneOffset: number): number {
  const now = new Date();
  // timezoneOffset is in minutes, same sign as Date.getTimezoneOffset()
  // (positive = behind UTC, e.g. EST = 300)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const deviceMs = utcMs - timezoneOffset * 60_000;
  return new Date(deviceMs).getHours();
}

function isQuietHours(localHour: number, start: number, end: number): boolean {
  if (start <= end) {
    // Non-wrapping: e.g. start=9, end=17
    return localHour >= start && localHour < end;
  }
  // Wraps midnight: e.g. start=23, end=7
  return localHour >= start || localHour < end;
}

interface ThrottleCheckParams {
  deviceId: string;
  timezoneOffset: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  type: NotificationType;
}

async function canSendToDevice(params: ThrottleCheckParams): Promise<boolean> {
  const { deviceId, timezoneOffset, quietHoursStart, quietHoursEnd, type } = params;

  // Quiet hours check (settlements are still delayed, not dropped)
  const localHour = getDeviceLocalHour(timezoneOffset);
  if (isQuietHours(localHour, quietHoursStart, quietHoursEnd)) {
    return false;
  }

  // 30-minute cooldown
  const cooldownCutoff = new Date(Date.now() - COOLDOWN_MS);
  const recentNotification = await prisma.notificationLog.findFirst({
    where: { deviceId, sentAt: { gt: cooldownCutoff } },
    select: { id: true },
  });
  if (recentNotification) return false;

  // Daily cap (settlements exempt)
  if (type !== "PREDICTION_SETTLED") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await prisma.notificationLog.count({
      where: {
        deviceId,
        type: { not: "PREDICTION_SETTLED" },
        sentAt: { gt: startOfDay },
      },
    });
    if (todayCount >= DAILY_CAP) return false;
  }

  return true;
}

// ─── Sending ───

interface SendParams {
  deviceId: string;
  expoPushToken: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  referenceId?: string;
}

async function sendToDevice(params: SendParams): Promise<void> {
  const { deviceId, expoPushToken, type, title, body, imageUrl, data, referenceId } = params;

  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.warn(`[Notifications] Invalid token for device ${deviceId}`);
    await prisma.pushDevice.update({
      where: { id: deviceId },
      data: { isActive: false },
    });
    return;
  }

  const message: ExpoPushMessage = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    channelId: ANDROID_CHANNEL_IDS[type],
    data: {
      ...data,
      ...(imageUrl ? { image: imageUrl } : {}),
    },
  };

  // Rich image on Android (large image in expanded notification)
  if (imageUrl) {
    (message as any).richContent = { image: imageUrl };
  }

  try {
    const [ticket] = await expo.sendPushNotificationsAsync([message]);
    const receiptId = (ticket as Extract<ExpoPushTicket, { id: string }>).id ?? null;

    await prisma.notificationLog.create({
      data: { deviceId, type, title, body, referenceId, expoReceiptId: receiptId },
    });
  } catch (error) {
    console.error(`[Notifications] Failed to send to device ${deviceId}:`, error);
  }
}

// ─── Broadcast (market movers + breaking news) ───

interface BroadcastParams {
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  referenceId?: string;
}

export async function broadcastNotification(params: BroadcastParams): Promise<void> {
  const { type, title, body, imageUrl, data, referenceId } = params;

  // Dedup: skip if we already sent a notification for this referenceId
  if (referenceId) {
    const alreadySent = await prisma.notificationLog.findFirst({
      where: { referenceId, type },
      select: { id: true },
    });
    if (alreadySent) return;
  }

  const preferenceField = type === "MARKET_MOVER" ? "marketMovers" : "breakingNews";

  const devices = await prisma.pushDevice.findMany({
    where: {
      isActive: true,
      preferences: { [preferenceField]: true },
    },
    select: {
      id: true,
      expoPushToken: true,
      timezoneOffset: true,
      preferences: { select: { quietHoursStart: true, quietHoursEnd: true } },
    },
  });

  let sent = 0;
  for (const device of devices) {
    const prefs = device.preferences;
    const canSend = await canSendToDevice({
      deviceId: device.id,
      timezoneOffset: device.timezoneOffset,
      quietHoursStart: prefs?.quietHoursStart ?? 23,
      quietHoursEnd: prefs?.quietHoursEnd ?? 7,
      type,
    });

    if (!canSend) continue;

    await sendToDevice({
      deviceId: device.id,
      expoPushToken: device.expoPushToken,
      type,
      title,
      body,
      imageUrl,
      data,
      referenceId,
    });
    sent++;
  }

  console.log(`[Notifications] Broadcast ${type}: sent to ${sent}/${devices.length} devices`);
}

// ─── Settlement notifications (personal) ───

interface SettlementParams {
  walletAddress: string;
  marketId: string;
  question: string;
  result: string; // "yes" | "no"
}

export async function sendSettlementNotification(params: SettlementParams): Promise<void> {
  const { walletAddress, marketId, question, result } = params;
  const resultUpper = result.toUpperCase();

  const devices = await prisma.pushDevice.findMany({
    where: {
      walletAddress,
      isActive: true,
      preferences: { predictionSettled: true },
    },
    select: {
      id: true,
      expoPushToken: true,
      timezoneOffset: true,
      preferences: { select: { quietHoursStart: true, quietHoursEnd: true } },
    },
  });

  for (const device of devices) {
    const prefs = device.preferences;
    const canSend = await canSendToDevice({
      deviceId: device.id,
      timezoneOffset: device.timezoneOffset,
      quietHoursStart: prefs?.quietHoursStart ?? 23,
      quietHoursEnd: prefs?.quietHoursEnd ?? 7,
      type: "PREDICTION_SETTLED",
    });

    if (!canSend) continue;

    await sendToDevice({
      deviceId: device.id,
      expoPushToken: device.expoPushToken,
      type: "PREDICTION_SETTLED",
      title: `Your bet settled ${resultUpper}`,
      body: truncateQuestion(question),
      data: { screen: "market-sheet", id: marketId },
      referenceId: `${marketId}:${walletAddress}`,
    });
  }
}

function truncateQuestion(q: string, max = 100): string {
  return q.length <= max ? q : q.slice(0, max - 1) + "…";
}

// ─── Receipt processing (detect invalid tokens) ───

export async function processExpoPushReceipts(): Promise<void> {
  const recentLogs = await prisma.notificationLog.findMany({
    where: {
      expoReceiptId: { not: null },
      sentAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true, deviceId: true, expoReceiptId: true },
  });

  if (recentLogs.length === 0) return;

  const receiptIdMap = new Map<string, string>(); // receiptId -> deviceId
  const receiptIds: string[] = [];

  for (const log of recentLogs) {
    if (log.expoReceiptId) {
      receiptIds.push(log.expoReceiptId);
      receiptIdMap.set(log.expoReceiptId, log.deviceId);
    }
  }

  const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

  for (const chunk of receiptChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

      for (const [receiptId, receipt] of Object.entries(receipts)) {
        if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
          const deviceId = receiptIdMap.get(receiptId);
          if (deviceId) {
            await prisma.pushDevice.update({
              where: { id: deviceId },
              data: { isActive: false },
            });
            console.log(`[Notifications] Deactivated device ${deviceId} (DeviceNotRegistered)`);
          }
        }
      }
    } catch (error) {
      console.error("[Notifications] Receipt processing failed:", error);
    }
  }
}

// ─── Price snapshot cleanup ───

export async function cleanupOldSnapshots(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.coinPriceSnapshot.deleteMany({
    where: { takenAt: { lt: cutoff } },
  });
  if (count > 0) {
    console.log(`[Notifications] Cleaned up ${count} old price snapshots`);
  }
}
