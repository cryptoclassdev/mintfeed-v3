/**
 * Validates that a URL is safe to fetch — rejects private/internal IPs and non-HTTP schemes.
 * Prevents SSRF attacks via user-controlled URLs (RSS images, OG images, etc.)
 */

const PRIVATE_IP_PATTERNS = [
  /^127\./,                  // Loopback
  /^10\./,                   // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./,             // Class C private
  /^169\.254\./,             // Link-local
  /^0\./,                    // Current network
  /^::1$/,                   // IPv6 loopback
  /^fc00:/i,                 // IPv6 unique local
  /^fe80:/i,                 // IPv6 link-local
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

export function isUrlSafe(urlString: string): boolean {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return false;
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return false;
    }
  }

  return true;
}
