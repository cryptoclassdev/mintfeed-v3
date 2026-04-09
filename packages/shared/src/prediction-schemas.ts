import { z } from "zod";
import { USDC_MINT } from "./types";
import { MINIMUM_TRADE_USD } from "./constants";

// --- Base58 pubkey: 32-44 alphanumeric chars (no 0, O, I, l) ---
const pubkeyRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const pubkeySchema = z.string().regex(pubkeyRegex, "Invalid Solana public key");

// --- Create Order (buy or sell) ---
export const CreateOrderSchema = z
  .object({
    ownerPubkey: pubkeySchema,
    marketId: z.string().min(1, "marketId must not be empty").optional(),
    positionPubkey: pubkeySchema.optional(),
    isYes: z.boolean(),
    isBuy: z.boolean(),
    depositAmount: z
      .string()
      .regex(/^\d+$/, "depositAmount must be a positive integer string")
      .optional(),
    depositMint: z.string().default(USDC_MINT),
    contracts: z
      .string()
      .regex(/^[1-9]\d*$/, "contracts must be a positive integer")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isBuy) {
      if (!data.marketId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "marketId is required for buy orders",
          path: ["marketId"],
        });
      }
      if (!data.depositAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "depositAmount is required for buy orders",
          path: ["depositAmount"],
        });
      } else {
        const microAmount = Number(data.depositAmount);
        const usdAmount = microAmount / 1_000_000;
        if (usdAmount < MINIMUM_TRADE_USD) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Minimum trade is $${MINIMUM_TRADE_USD}`,
            path: ["depositAmount"],
          });
        }
      }
    } else {
      // sell
      if (!data.positionPubkey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "positionPubkey is required for sell orders",
          path: ["positionPubkey"],
        });
      }
      if (!data.contracts) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "contracts is required for sell orders",
          path: ["contracts"],
        });
      }
    }
  });

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// --- Close Position ---
export const ClosePositionSchema = z.object({
  positionPubkey: pubkeySchema,
  ownerPubkey: pubkeySchema,
  isYes: z.boolean(),
  contracts: z.string().regex(/^[1-9]\d*$/, "contracts must be a positive integer"),
});

export type ClosePositionInput = z.infer<typeof ClosePositionSchema>;

// --- Claim Position ---
export const ClaimPositionSchema = z.object({
  positionPubkey: pubkeySchema,
  ownerPubkey: pubkeySchema,
});

export type ClaimPositionInput = z.infer<typeof ClaimPositionSchema>;

// --- Helpers ---

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}
