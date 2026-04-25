import { describe, expect, it } from "vitest";
import { buildFeedWhere, isFeedSummaryReady } from "./feed";

describe("buildFeedWhere", () => {
  it("only returns image-ready and summary-ready articles for the all feed", () => {
    expect(buildFeedWhere("all")).toEqual({
      imageUrl: { not: null },
      imageBlurhash: { not: null },
      summary: { not: "" },
    });
  });

  it("only returns image-ready and summary-ready articles for category feeds", () => {
    expect(buildFeedWhere("crypto")).toEqual({
      category: "CRYPTO",
      imageUrl: { not: null },
      imageBlurhash: { not: null },
      summary: { not: "" },
    });
  });
});

describe("isFeedSummaryReady", () => {
  it.each([".", "?", "!"])("allows complete Gemini summaries ending in %s", (ending) => {
    const summary = [
      "Midnight users can now read a complete market update with enough detail for context",
      "before deciding whether a prediction is worth opening in the trading sheet",
      "because the summary finishes as a full sentence",
    ].join(" ");

    expect(isFeedSummaryReady(`${summary}${ending}`)).toBe(true);
  });

  it("rejects old exactly-300-character fallback summaries", () => {
    const paddedSummary = `${"word ".repeat(59)}word.`;

    expect(paddedSummary).toHaveLength(300);
    expect(isFeedSummaryReady(paddedSummary)).toBe(false);
  });

  it.each([",", ":", ";"])("rejects summaries ending mid-thought with %s", (ending) => {
    const summary = [
      "This article has enough words to pass the minimum word count requirement",
      "but it should not appear because the text clearly stops in the middle",
      `of a sentence${ending}`,
    ].join(" ");

    expect(isFeedSummaryReady(summary)).toBe(false);
  });

  it("rejects summaries ending mid-word", () => {
    const summary = [
      "This article has enough words to pass the minimum word count requirement",
      "but it still looks broken because the summary abruptly cuts off while explaining",
      "the latest develop",
    ].join(" ");

    expect(isFeedSummaryReady(summary)).toBe(false);
  });

  it("rejects very short summaries under 20 words", () => {
    expect(isFeedSummaryReady("A short summary can end cleanly but still lacks enough useful context.")).toBe(false);
  });
});
