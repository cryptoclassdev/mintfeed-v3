import {
  getSolFeeBalanceError,
  getUsdcBalanceError,
  type WalletBalances,
} from "../balance";

describe("balance validation", () => {
  const balances: WalletBalances = {
    solLamports: 18_000_000,
    usdcMicroAmount: 5_830_000,
  };

  it("does not block USDC checks on the old 0.03 SOL threshold", () => {
    expect(getUsdcBalanceError(balances, 5_010_000)).toBeNull();
  });

  it("still blocks when USDC is insufficient", () => {
    expect(getUsdcBalanceError(balances, 6_000_000)).toBe(
      "Insufficient USDC. You have $5.83 but need $6.00.",
    );
  });

  it("blocks SOL dynamically when actual fee requirement is higher than balance", () => {
    expect(getSolFeeBalanceError(balances, 20_000_000)).toBe(
      "Need about 0.02 SOL for network fees. You have 0.018 SOL.",
    );
  });

  it("allows SOL when dynamic fee requirement is covered", () => {
    expect(getSolFeeBalanceError(balances, 5_005_000)).toBeNull();
  });
});
