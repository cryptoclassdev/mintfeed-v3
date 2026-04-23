import {
  formatSwipePrice,
  getFreshSwipePriceUsd,
  shouldAbortForQuoteDrift,
} from "../useSwipeBet";

describe("useSwipeBet quote helpers", () => {
  it("converts fresh pricing into a side-specific usd quote", () => {
    expect(
      getFreshSwipePriceUsd(
        {
          buyYesPriceUsd: 130000,
          buyNoPriceUsd: 870000,
        },
        "yes",
      ),
    ).toBe(0.13);

    expect(
      getFreshSwipePriceUsd(
        {
          buyYesPriceUsd: 130000,
          buyNoPriceUsd: 870000,
        },
        "no",
      ),
    ).toBe(0.87);
  });

  it("formats swipe prices as cents", () => {
    expect(formatSwipePrice(0.13)).toBe("13¢");
    expect(formatSwipePrice(0.865)).toBe("87¢");
  });

  it("aborts when quote drift is at least 3 cents", () => {
    expect(shouldAbortForQuoteDrift(0.09, 0.13)).toBe(true);
    expect(shouldAbortForQuoteDrift(0.1, 0.12)).toBe(false);
    expect(shouldAbortForQuoteDrift(null, 0.13)).toBe(false);
  });
});
