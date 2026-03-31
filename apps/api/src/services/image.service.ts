import sharp from "sharp";
import ky from "ky";
import { isUrlSafe } from "../middleware/url-validator";

export async function generateBlurhash(imageUrl: string): Promise<string | null> {
  if (!isUrlSafe(imageUrl)) {
    console.warn(`[Image] Rejected unsafe URL: ${imageUrl}`);
    return null;
  }

  try {
    const response = await ky.get(imageUrl, { timeout: 10_000 }).arrayBuffer();
    const buffer = Buffer.from(response);

    const { data, info } = await sharp(buffer)
      .resize(32, 32, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Simple base64 thumbnail as placeholder (full blurhash would need blurhash library)
    const thumbnail = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .jpeg({ quality: 20 })
      .toBuffer();

    return `data:image/jpeg;base64,${thumbnail.toString("base64")}`;
  } catch (error) {
    console.error(`[Image] Failed to generate blurhash for ${imageUrl}:`, error);
    return null;
  }
}
