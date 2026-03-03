import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Article, PaginatedResponse } from "@mintfeed/shared";
import { useAppStore } from "@/lib/store";

export function useFeed() {
  const category = useAppStore((s) => s.selectedCategory);

  return useInfiniteQuery({
    queryKey: ["feed", category],
    queryFn: async ({ pageParam }) => {
      const searchParams: Record<string, string> = {
        category,
        limit: "20",
      };
      if (pageParam) {
        searchParams.cursor = pageParam;
      }

      if (__DEV__) console.log("[useFeed] Fetching feed:", { category, pageParam });
      try {
        const result = await api
          .get("api/v1/feed", { searchParams })
          .json<PaginatedResponse<Article>>();
        if (__DEV__) console.log("[useFeed] Got", result.data?.length, "articles, hasMore:", result.hasMore);
        return result;
      } catch (err: any) {
        if (__DEV__) console.error("[useFeed] Fetch failed:", err.message, err.name, err.response?.status);
        throw err;
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
}
