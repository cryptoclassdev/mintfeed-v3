import dns from "node:dns";
// Force IPv4-only DNS resolution for external APIs — VPNs often don't
// tunnel IPv6, causing Node.js connection timeouts. Supabase/DB hosts
// are excluded so Prisma's connection engine isn't affected.
const DB_HOSTS = new Set(["pooler.supabase.com", "supabase.co"]);
function isDbHost(hostname: string): boolean {
  return [...DB_HOSTS].some((h) => hostname.endsWith(h));
}
const originalLookup = dns.lookup;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
dns.lookup = ((...args: any[]) => {
  const [hostname] = args;
  if (isDbHost(hostname)) {
    return originalLookup.apply(dns, args as any);
  }
  let options: dns.LookupOptions;
  let callback: (...a: any[]) => void;
  if (typeof args[1] === "function") {
    callback = args[1];
    options = { family: 4 };
  } else {
    callback = args[2];
    options =
      typeof args[1] === "number"
        ? { family: 4 }
        : { ...args[1], family: 4 };
  }
  return originalLookup(hostname, options, callback as any);
}) as typeof dns.lookup;

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { feedRoutes } from "./routes/feed";
import { marketRoutes } from "./routes/market";
import { healthRoutes } from "./routes/health";
import { predictionRoutes } from "./routes/predictions";
import { skrRoutes } from "./routes/skr";
import { seekerRoutes } from "./routes/seeker";
import { notificationRoutes } from "./routes/notifications";
import { startCronJobs } from "./cron";
import { rateLimit } from "./middleware/rate-limit";

const app = new Hono();

app.use("*", logger());

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: ALLOWED_ORIGINS.length > 0
      ? ALLOWED_ORIGINS
      : ["https://mintfeed-api-production.up.railway.app", "https://mintfeed-api-staging.up.railway.app"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Global rate limit: 100 requests per minute per IP
app.use("/api/v1/*", rateLimit({ max: 100, keyPrefix: "api" }));

// Stricter limits on sensitive endpoints
app.use("/api/v1/predictions/transactions/*", rateLimit({ max: 10, keyPrefix: "tx" }));
app.use("/api/v1/predictions/orders", rateLimit({ max: 20, keyPrefix: "orders" }));
app.use("/api/v1/notifications/register", rateLimit({ max: 10, keyPrefix: "notif-reg" }));

app.route("/api/v1", feedRoutes);
app.route("/api/v1", marketRoutes);
app.route("/api/v1", healthRoutes);
app.route("/api/v1", predictionRoutes);
app.route("/api/v1", skrRoutes);
app.route("/api/v1", seekerRoutes);
app.route("/api/v1", notificationRoutes);

const PORT = Number(process.env.PORT) || 3000;

console.log(`Starting Midnight API on port ${PORT}`);

startCronJobs();

serve({
  fetch: app.fetch,
  port: PORT,
});
