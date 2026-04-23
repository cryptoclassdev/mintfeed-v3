export function buildResolutionRulePreview(
  rulesPrimary: string | null | undefined,
  maxLength = 180,
): { text: string | null; truncated: boolean } {
  if (!rulesPrimary) return { text: null, truncated: false };

  const normalized = rulesPrimary.replace(/\s+/g, " ").trim();
  if (!normalized) return { text: null, truncated: false };
  if (normalized.length <= maxLength) {
    return { text: normalized, truncated: false };
  }

  const truncated = normalized.slice(0, maxLength).trimEnd();
  const lastSentenceBreak = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("? "),
    truncated.lastIndexOf("! "),
  );

  if (lastSentenceBreak >= Math.floor(maxLength * 0.6)) {
    return {
      text: `${truncated.slice(0, lastSentenceBreak + 1).trimEnd()}…`,
      truncated: true,
    };
  }

  return {
    text: `${truncated}…`,
    truncated: true,
  };
}

export function formatResolveDateTime(closeTimeUnix: number): string {
  return new Date(closeTimeUnix * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}
