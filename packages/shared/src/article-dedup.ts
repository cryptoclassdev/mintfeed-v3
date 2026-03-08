import type { Article } from "./types";

function normalizeContent(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type ArticleContentInput = Pick<Article, "title" | "summary" | "originalTitle">;

export function buildArticleContentKey(article: ArticleContentInput): string {
  const headline = normalizeContent(article.originalTitle) || normalizeContent(article.title);
  const summary = normalizeContent(article.summary);
  return `${headline}::${summary}`;
}

export function dedupeArticlesByContent<T extends ArticleContentInput>(articles: T[]): T[] {
  const seen = new Set<string>();

  return articles.filter((article) => {
    const key = buildArticleContentKey(article);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
