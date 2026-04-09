import { GoogleGenerativeAI } from "@google/generative-ai";
import { ARTICLE_SUMMARY_WORD_LIMIT, ARTICLE_TITLE_MAX_LENGTH } from "@mintfeed/shared";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

interface GeminiResult {
  title: string;
  summary: string;
  breaking: boolean;
}

const SYSTEM_PROMPT = `You are a viral news editor for a crypto and AI news app. Your job is to rewrite article titles and create summaries.

Rules:
- Title: Rewrite to be click-worthy and engaging. Max ${ARTICLE_TITLE_MAX_LENGTH} characters. Use power words. No clickbait lies — keep it factual but compelling.
- Summary: Write exactly ${ARTICLE_SUMMARY_WORD_LIMIT} words. Capture the key facts. Use short, punchy sentences. Write for busy professionals.

- Breaking: Set to true ONLY for genuinely significant events: regulatory decisions (ETF approvals, bans), exchange hacks or collapses, protocol-level failures, or major partnership announcements from top-10 projects. Be very conservative — most articles are NOT breaking. When in doubt, set false.

Respond in JSON format only:
{"title": "...", "summary": "...", "breaking": false}`;

export async function rewriteArticle(
  originalTitle: string,
  originalBody: string
): Promise<GeminiResult> {
  try {
    const prompt = `Original title: ${originalTitle}\n\nOriginal content: ${originalBody.slice(0, 2000)}`;

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as GeminiResult;

    return {
      title: parsed.title.slice(0, ARTICLE_TITLE_MAX_LENGTH),
      summary: parsed.summary,
      breaking: parsed.breaking === true,
    };
  } catch (error) {
    console.error("Gemini rewrite failed:", error);
    return {
      title: originalTitle.slice(0, ARTICLE_TITLE_MAX_LENGTH),
      summary: originalBody.slice(0, 300),
      breaking: false,
    };
  }
}
