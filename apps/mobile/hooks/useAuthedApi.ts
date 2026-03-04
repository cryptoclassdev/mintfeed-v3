import { useMemo } from "react";
import { usePrivy } from "@privy-io/expo";
import { api } from "@/lib/api-client";

/**
 * Returns a ky client with Authorization header attached.
 * Not used by existing feed/market hooks — available for future authenticated endpoints.
 */
export function useAuthedApi() {
  const { getAccessToken } = usePrivy();

  return useMemo(
    () =>
      api.extend({
        hooks: {
          beforeRequest: [
            async (request) => {
              const token = await getAccessToken();
              if (token) {
                request.headers.set("Authorization", `Bearer ${token}`);
              }
            },
          ],
        },
      }),
    [getAccessToken]
  );
}
