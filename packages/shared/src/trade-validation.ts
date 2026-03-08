import { MINIMUM_TRADE_USD } from "./constants";
import { MICRO_USD } from "./types";

type ValidationError = "BELOW_MINIMUM" | "INVALID_NUMBER";

interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
}

export function validateTradeAmount(amountStr: string): ValidationResult {
  const parsed = parseTradeAmount(amountStr);
  if (parsed === null) return { valid: false, error: "INVALID_NUMBER" };
  if (parsed <= MINIMUM_TRADE_USD) return { valid: false, error: "BELOW_MINIMUM" };
  return { valid: true };
}

export function parseTradeAmount(amountStr: string): number | null {
  if (!amountStr || amountStr.trim() === "") return null;
  const num = Number(amountStr);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

export function isBinaryMarket(outcomes: unknown): boolean {
  if (!Array.isArray(outcomes)) return false;
  if (outcomes.length !== 2) return false;
  const normalized = outcomes.map((o) => String(o).toLowerCase());
  return normalized.includes("yes") && normalized.includes("no");
}

export function formatResolutionCountdown(closeTimeUnix: number): string {
  const now = Date.now();
  const closeMs = closeTimeUnix * 1000;
  const diffMs = closeMs - now;

  if (diffMs <= 0) return "Resolved";

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (days > 0) return `Resolves in ${days} ${days === 1 ? "day" : "days"}`;
  if (hours > 0) return `Resolves in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  if (minutes > 0) return `Resolves in ${minutes} min`;
  return "Resolves today";
}

export function formatCompactVolume(volumeMicroUsd: number): string | null {
  if (!volumeMicroUsd || volumeMicroUsd <= 0) return null;
  const usd = volumeMicroUsd / MICRO_USD;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

export function formatCompactDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return null;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function computeLiquiditySpread(pricing: { buyYesPriceUsd: number; sellYesPriceUsd: number }): number {
  if (pricing.buyYesPriceUsd === 0 && pricing.sellYesPriceUsd === 0) return 0;
  return (pricing.sellYesPriceUsd - pricing.buyYesPriceUsd) / MICRO_USD;
}
