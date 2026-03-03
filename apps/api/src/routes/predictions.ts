import { Hono } from "hono";
import { fetchLivePrices } from "../services/jupiter-prediction.service";

export const predictionRoutes = new Hono();

/**
 * GET /api/v1/predictions/live?ids=id1,id2,id3
 * Returns live outcome prices for the given market IDs.
 */
predictionRoutes.get("/predictions/live", async (c) => {
  try {
    const idsParam = c.req.query("ids") ?? "";
    const marketIds = idsParam.split(",").filter(Boolean);

    if (marketIds.length === 0) {
      return c.json({ data: {} });
    }

    const data = await fetchLivePrices(marketIds);
    return c.json({ data });
  } catch (error) {
    console.error("[Predictions] Live prices error:", error);
    return c.json({ data: {} });
  }
});
