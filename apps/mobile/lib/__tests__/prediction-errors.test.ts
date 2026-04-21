import { getMinimumTradeUsdFromError } from "../prediction-errors";

describe("getMinimumTradeUsdFromError", () => {
  it("extracts a minimum trade from server errors", () => {
    expect(
      getMinimumTradeUsdFromError(new Error("Minimum order is $5")),
    ).toBe(5);
    expect(
      getMinimumTradeUsdFromError(new Error("Minimum trade is $12.50")),
    ).toBe(12.5);
  });

  it("returns null when no minimum trade is present", () => {
    expect(getMinimumTradeUsdFromError(new Error("Request failed"))).toBeNull();
    expect(getMinimumTradeUsdFromError(null)).toBeNull();
  });
});
