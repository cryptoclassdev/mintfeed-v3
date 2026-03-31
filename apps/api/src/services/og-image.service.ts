import ky from "ky";
import { isUrlSafe } from "../middleware/url-validator";

/**
 * Fetches a URL and extracts the og:image meta tag value.
 * Only reads the first 50KB to avoid downloading entire pages.
 * Returns null on any failure.
 */
export async function extractOgImage(url: string): Promise<string | null> {
  if (!isUrlSafe(url)) return null;

  try {
    const response = await ky.get(url, {
      timeout: 5_000,
      headers: { "User-Agent": "Midnight/1.0" },
    });

    const reader = response.body?.getReader();
    if (!reader) return null;

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const maxBytes = 50_000;

    while (totalBytes < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      totalBytes += value.length;
    }

    reader.cancel().catch(() => {});

    const html = new TextDecoder().decode(
      chunks.length === 1 ? chunks[0] : Buffer.concat(chunks),
    );

    const match = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    ) ?? html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    );

    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
