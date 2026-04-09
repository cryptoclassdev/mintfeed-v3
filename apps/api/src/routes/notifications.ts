import { Hono } from "hono";
import Expo from "expo-server-sdk";
import { prisma } from "@mintfeed/db";

const expo = new Expo();
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function requireAdmin(c: any): Response | null {
  if (!ADMIN_SECRET) return c.json({ error: "Admin endpoints disabled" }, 404);
  const auth = c.req.header("authorization");
  if (auth !== `Bearer ${ADMIN_SECRET}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return null;
}

export const notificationRoutes = new Hono();

// Register or update a push device
notificationRoutes.post("/notifications/register", async (c) => {
  const body = await c.req.json<{
    expoPushToken: string;
    walletAddress?: string;
    platform?: string;
    timezoneOffset?: number;
  }>();

  if (!body.expoPushToken) {
    return c.json({ error: "expoPushToken is required" }, 400);
  }

  try {
    const device = await prisma.pushDevice.upsert({
      where: { expoPushToken: body.expoPushToken },
      update: {
        walletAddress: body.walletAddress ?? undefined,
        platform: body.platform ?? undefined,
        timezoneOffset: body.timezoneOffset ?? undefined,
        isActive: true,
      },
      create: {
        expoPushToken: body.expoPushToken,
        walletAddress: body.walletAddress ?? null,
        platform: body.platform ?? null,
        timezoneOffset: body.timezoneOffset ?? 0,
      },
    });

    // Ensure default preferences exist
    await prisma.notificationPreference.upsert({
      where: { deviceId: device.id },
      update: {},
      create: { deviceId: device.id },
    });

    return c.json({ deviceId: device.id });
  } catch (error) {
    console.error("[Notifications] Register failed:", error);
    return c.json({ error: "Failed to register device" }, 500);
  }
});

// Update notification preferences
notificationRoutes.put("/notifications/preferences", async (c) => {
  const body = await c.req.json<{
    expoPushToken: string;
    marketMovers?: boolean;
    breakingNews?: boolean;
    predictionSettled?: boolean;
    quietHoursStart?: number;
    quietHoursEnd?: number;
  }>();

  if (!body.expoPushToken) {
    return c.json({ error: "expoPushToken is required" }, 400);
  }

  try {
    const device = await prisma.pushDevice.findUnique({
      where: { expoPushToken: body.expoPushToken },
      select: { id: true },
    });

    if (!device) {
      return c.json({ error: "Device not found" }, 404);
    }

    const { expoPushToken: _, ...updates } = body;
    const prefs = await prisma.notificationPreference.upsert({
      where: { deviceId: device.id },
      update: updates,
      create: { deviceId: device.id, ...updates },
    });

    return c.json(prefs);
  } catch (error) {
    console.error("[Notifications] Preferences update failed:", error);
    return c.json({ error: "Failed to update preferences" }, 500);
  }
});

// Get notification preferences
notificationRoutes.get("/notifications/preferences", async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "token query param is required" }, 400);
  }

  try {
    const device = await prisma.pushDevice.findUnique({
      where: { expoPushToken: token },
      select: {
        id: true,
        preferences: {
          select: {
            marketMovers: true,
            breakingNews: true,
            predictionSettled: true,
            quietHoursStart: true,
            quietHoursEnd: true,
          },
        },
      },
    });

    if (!device) {
      return c.json({ error: "Device not found" }, 404);
    }

    return c.json(device.preferences ?? {
      marketMovers: true,
      breakingNews: true,
      predictionSettled: true,
      quietHoursStart: 23,
      quietHoursEnd: 7,
    });
  } catch (error) {
    console.error("[Notifications] Preferences fetch failed:", error);
    return c.json({ error: "Failed to fetch preferences" }, 500);
  }
});

// Debug: list registered devices and recent notification logs (admin only)
notificationRoutes.get("/notifications/debug", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  try {
    const devices = await prisma.pushDevice.findMany({
      select: {
        id: true,
        expoPushToken: true,
        walletAddress: true,
        platform: true,
        isActive: true,
        timezoneOffset: true,
        createdAt: true,
        preferences: {
          select: {
            marketMovers: true,
            breakingNews: true,
            predictionSettled: true,
            quietHoursStart: true,
            quietHoursEnd: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const recentLogs = await prisma.notificationLog.findMany({
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        sentAt: true,
        expoReceiptId: true,
        deviceId: true,
      },
      orderBy: { sentAt: "desc" },
      take: 20,
    });

    return c.json({ devices, recentLogs });
  } catch (error) {
    console.error("[Notifications] Debug query failed:", error);
    return c.json({ error: "Debug query failed" }, 500);
  }
});

// Test: send a test notification to all active devices (admin only)
notificationRoutes.post("/notifications/test", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  try {
    const devices = await prisma.pushDevice.findMany({
      where: { isActive: true },
      select: { id: true, expoPushToken: true },
    });

    if (devices.length === 0) {
      return c.json({ error: "No active devices registered", devices: [] }, 404);
    }

    const messages = devices
      .filter((d) => Expo.isExpoPushToken(d.expoPushToken))
      .map((d) => ({
        to: d.expoPushToken,
        sound: "default" as const,
        title: "MintFeed Test",
        body: "If you see this, push notifications are working!",
        data: { screen: "market" },
      }));

    if (messages.length === 0) {
      return c.json({ error: "No valid Expo push tokens found", devices }, 400);
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      const result = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...result);
    }

    return c.json({
      sent: messages.length,
      totalDevices: devices.length,
      tickets,
    });
  } catch (error) {
    console.error("[Notifications] Test send failed:", error);
    return c.json({ error: "Test send failed" }, 500);
  }
});
