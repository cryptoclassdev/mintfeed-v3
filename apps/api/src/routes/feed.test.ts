import { describe, expect, it } from "vitest";
import { buildFeedWhere } from "./feed";

describe("buildFeedWhere", () => {
  it("only returns image-ready articles for the all feed", () => {
    expect(buildFeedWhere("all")).toEqual({
      imageUrl: { not: null },
      imageBlurhash: { not: null },
    });
  });

  it("only returns image-ready articles for category feeds", () => {
    expect(buildFeedWhere("crypto")).toEqual({
      category: "CRYPTO",
      imageUrl: { not: null },
      imageBlurhash: { not: null },
    });
  });
});
