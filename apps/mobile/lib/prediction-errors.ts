const MINIMUM_TRADE_ERROR_PATTERN = /Minimum (?:order|trade) is \$\s*(\d+(?:\.\d+)?)/i;

export function getMinimumTradeUsdFromError(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const match = MINIMUM_TRADE_ERROR_PATTERN.exec(message);
  if (!match) return null;

  const minimumTradeUsd = Number(match[1]);
  return Number.isFinite(minimumTradeUsd) && minimumTradeUsd > 0
    ? minimumTradeUsd
    : null;
}
