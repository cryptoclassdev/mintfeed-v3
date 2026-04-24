import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { GenerativeModel, GenerationConfig, ResponseSchema } from "@google/generative-ai";
import { ARTICLE_SUMMARY_WORD_LIMIT, ARTICLE_TITLE_MAX_LENGTH } from "@midnight/shared";

export const GEMINI_REWRITE_MODEL = "gemini-2.5-flash";
const GEMINI_MAX_OUTPUT_TOKENS = 1200;
const FALLBACK_SUMMARY_MAX_LENGTH = 300;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: GEMINI_REWRITE_MODEL });
export const GEMINI_REWRITE_PROMPT_VERSION = "article-rewrite-v2";

type GeminiGenerationConfig = GenerationConfig & {
  thinkingConfig?: {
    thinkingBudget: number;
  };
};

interface GeminiResult {
  title: string;
  summary: string;
  breaking: boolean;
}

export const SYSTEM_PROMPT = `You are a viral news editor for a crypto and AI news app. Your job is to rewrite article titles and create summaries.

Rules:
- Title: Rewrite to be click-worthy and engaging. Max ${ARTICLE_TITLE_MAX_LENGTH} characters. End on a whole word — never trail off mid-word or with a stray hyphen / em-dash. Use power words. No clickbait lies — keep it factual but compelling.
- Summary: Write exactly ${ARTICLE_SUMMARY_WORD_LIMIT} words, split into TWO short paragraphs separated by "\\n\\n". The first paragraph is the hook (1 sentence). The second paragraph delivers the payoff (1–2 sentences). Every sentence must end with a period, question mark, or exclamation mark — never mid-clause. Use short, punchy sentences. Write for busy professionals.

- Breaking: Set to true ONLY for genuinely significant events: regulatory decisions (ETF approvals, bans), exchange hacks or collapses, protocol-level failures, or major partnership announcements from top-10 projects. Be very conservative — most articles are NOT breaking. When in doubt, set false.

Return only the requested JSON object.`;

const REWRITE_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description: `Rewritten headline, max ${ARTICLE_TITLE_MAX_LENGTH} characters.`,
    },
    summary: {
      type: SchemaType.STRING,
      description: `Exactly ${ARTICLE_SUMMARY_WORD_LIMIT} words in two short paragraphs separated by "\\n\\n".`,
    },
    breaking: {
      type: SchemaType.BOOLEAN,
      description: "True only for genuinely significant breaking news.",
    },
  },
  required: ["title", "summary", "breaking"],
};

const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const DASH_RUN_REGEX = /[-\u2013\u2014]{2,}/g;
const TRAILING_PUNCT_REGEX = /[\s\p{Pd}\p{Pi}\p{Pf}:,;]+$/u;
const SENTENCE_END_REGEX = /[.!?]$/;

function sanitize(text: string): string {
  return text.replace(CONTROL_CHAR_REGEX, "").replace(DASH_RUN_REGEX, "\u2014").trim();
}

function trimTitleToLimit(title: string, limit: number): string {
  if (title.length <= limit) return title;
  const hardCut = title.slice(0, limit);
  const lastSpace = hardCut.lastIndexOf(" ");
  const boundary = lastSpace > limit * 0.6 ? hardCut.slice(0, lastSpace) : hardCut;
  return boundary.replace(TRAILING_PUNCT_REGEX, "").trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function normalizeSummary(summary: string): string {
  const paragraphs = summary
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return paragraphs.length > 1
    ? paragraphs.slice(0, 2).join("\n\n")
    : summary.replace(/[ \t]+/g, " ").trim();
}

function trimSummaryToSentenceBoundary(summary: string): string {
  const normalized = sanitize(summary).replace(/\s+/g, " ").trim();
  if (normalized.length <= FALLBACK_SUMMARY_MAX_LENGTH) return normalized;

  const truncated = normalized.slice(0, FALLBACK_SUMMARY_MAX_LENGTH);
  const sentenceEnds = [...truncated.matchAll(/[.!?](?=\s|$)/g)];
  const lastSentenceEnd = sentenceEnds.at(-1)?.index;

  if (lastSentenceEnd !== undefined && lastSentenceEnd > FALLBACK_SUMMARY_MAX_LENGTH * 0.35) {
    return truncated.slice(0, lastSentenceEnd + 1).trim();
  }

  const lastSpace = truncated.lastIndexOf(" ");
  const wordBoundary =
    lastSpace > FALLBACK_SUMMARY_MAX_LENGTH * 0.5 ? truncated.slice(0, lastSpace) : truncated;
  const cleanSummary = wordBoundary.replace(TRAILING_PUNCT_REGEX, "").trim();

  return cleanSummary.endsWith(".") ? cleanSummary : `${cleanSummary}.`;
}

function isValidGeminiResult(result: GeminiResult): boolean {
  if (!result.title || result.title.length > ARTICLE_TITLE_MAX_LENGTH) return false;
  if (!result.summary || !SENTENCE_END_REGEX.test(result.summary.trim())) return false;
  if (countWords(result.summary) < Math.floor(ARTICLE_SUMMARY_WORD_LIMIT * 0.75)) return false;
  return typeof result.breaking === "boolean";
}

function fallbackResult(originalTitle: string, originalBody: string): GeminiResult {
  return {
    title: trimTitleToLimit(sanitize(originalTitle), ARTICLE_TITLE_MAX_LENGTH),
    summary: trimSummaryToSentenceBoundary(originalBody),
    breaking: false,
  };
}

function buildUserPrompt(originalTitle: string, originalBody: string): string {
  return [
    `Prompt version: ${GEMINI_REWRITE_PROMPT_VERSION}`,
    `Original title: ${originalTitle}`,
    `Original content: ${originalBody.slice(0, 6000)}`,
  ].join("\n\n");
}

export async function rewriteArticle(
  originalTitle: string,
  originalBody: string,
  rewriteModel: GenerativeModel = model,
): Promise<GeminiResult> {
  try {
    const generationConfig: GeminiGenerationConfig = {
      responseMimeType: "application/json",
      responseSchema: REWRITE_RESPONSE_SCHEMA,
      temperature: 0.4,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: 0 },
    };

    const result = await rewriteModel.generateContent({
      systemInstruction: SYSTEM_PROMPT,
      contents: [
        { role: "user", parts: [{ text: buildUserPrompt(originalTitle, originalBody) }] },
      ],
      generationConfig,
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as GeminiResult;

    const rewritten = {
      title: trimTitleToLimit(sanitize(parsed.title ?? ""), ARTICLE_TITLE_MAX_LENGTH),
      summary: normalizeSummary(sanitize(parsed.summary ?? "")),
      breaking: parsed.breaking === true,
    };

    if (!isValidGeminiResult(rewritten)) {
      throw new Error("Gemini response failed validation");
    }

    return rewritten;
  } catch (error) {
    console.error("Gemini rewrite failed:", error);
    return fallbackResult(originalTitle, originalBody);
  }
}
