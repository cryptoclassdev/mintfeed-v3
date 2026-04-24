import { describe, expect, it, vi } from "vitest";
import {
  GEMINI_REWRITE_MODEL,
  GEMINI_REWRITE_PROMPT_VERSION,
  SYSTEM_PROMPT,
  rewriteArticle,
} from "./gemini.service";

function makeModel(responseText: string) {
  return {
    generateContent: vi.fn().mockResolvedValue({
      response: {
        text: () => responseText,
      },
    }),
  };
}

describe("rewriteArticle", () => {
  it("uses system instructions, schema-constrained JSON, and a lower temperature", async () => {
    const model = makeModel(JSON.stringify({
      title: "Bitcoin Traders Brace for a Volatile Week",
      summary:
        "Bitcoin traders are watching volatility rise as ETF flows, macro data, and thinner weekend liquidity collide across major exchanges.\n\nThe setup could shape risk appetite across crypto markets this week as desks rebalance after recent gains. Analysts say liquidity remains thin, making sharp moves more likely if fresh inflation data or ETF flows surprise investors.",
      breaking: false,
    }));

    await expect(
      rewriteArticle(
        "Original BTC title",
        "Original BTC article body ".repeat(80),
        model as any,
      ),
    ).resolves.toMatchObject({
      title: "Bitcoin Traders Brace for a Volatile Week",
      breaking: false,
    });

    expect(model.generateContent).toHaveBeenCalledTimes(1);
    const request = model.generateContent.mock.calls[0][0];
    expect(request.systemInstruction).toBe(SYSTEM_PROMPT);
    expect(request.contents[0].parts[0].text).toContain(
      `Prompt version: ${GEMINI_REWRITE_PROMPT_VERSION}`,
    );
    expect(request.contents[0].parts[0].text).toContain(
      "Original title: Original BTC title",
    );
    expect(request.generationConfig).toMatchObject({
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 1200,
      thinkingConfig: { thinkingBudget: 0 },
    });
    expect(request.generationConfig.responseSchema.required).toEqual([
      "title",
      "summary",
      "breaking",
    ]);
  });

  it("uses a current Gemini Flash model", () => {
    expect(GEMINI_REWRITE_MODEL).toBe("gemini-2.5-flash");
  });

  it("normalizes summaries into at most two paragraphs", async () => {
    const model = makeModel(JSON.stringify({
      title: "AI Tokens Rally as Traders Chase New Catalysts",
      summary:
        "AI tokens rallied after traders rotated toward fresh crypto narratives and searched for momentum beyond Bitcoin's latest range.\n\nVolume climbed across several large-cap names as speculation returned to infrastructure and agent projects. The move suggests risk appetite is broadening, though analysts warned that liquidity remains uneven and reversals can arrive quickly.\n\nA third paragraph should not leak through.",
      breaking: false,
    }));

    const result = await rewriteArticle(
      "AI tokens rally",
      "Body ".repeat(120),
      model as any,
    );

    expect(result.summary).toBe(
      "AI tokens rallied after traders rotated toward fresh crypto narratives and searched for momentum beyond Bitcoin's latest range.\n\nVolume climbed across several large-cap names as speculation returned to infrastructure and agent projects. The move suggests risk appetite is broadening, though analysts warned that liquidity remains uneven and reversals can arrive quickly.",
    );
  });

  it("falls back when Gemini returns invalid structured output", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const model = makeModel(JSON.stringify({
      title: "",
      summary: "Too short.",
      breaking: "nope",
    }));

    const result = await rewriteArticle(
      "A very long title that should be preserved but trimmed cleanly without getting cut halfway through an ugly dangling clause",
      "Fallback body with useful context for readers.",
      model as any,
    );

    expect(result).toEqual({
      title:
        "A very long title that should be preserved but trimmed cleanly without getting",
      summary: "Fallback body with useful context for readers.",
      breaking: false,
    });
    expect(errorSpy).toHaveBeenCalledWith(
      "Gemini rewrite failed:",
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it("does not cut fallback summaries mid-word or mid-sentence", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const model = makeModel("{\"title\":\"Broken");

    const result = await rewriteArticle(
      "Fallback title",
      [
        "First sentence has enough context for the fallback summary to be useful.",
        "Second sentence should be kept because it still fits within the fallback limit.",
        "This final sentence is intentionally long and should not be chopped into an ugly partial token when the body exceeds the maximum fallback summary length ".repeat(4),
      ].join(" "),
      model as any,
    );

    expect(result.summary).toBe(
      "First sentence has enough context for the fallback summary to be useful. Second sentence should be kept because it still fits within the fallback limit.",
    );
    expect(result.summary).toMatch(/[.!?]$/);
    expect(result.summary).not.toMatch(/\b(part|tok|limi)$/);

    errorSpy.mockRestore();
  });
});
