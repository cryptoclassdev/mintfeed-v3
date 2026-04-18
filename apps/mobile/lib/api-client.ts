import ky from "ky";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Define it in apps/mobile/.env (dev) or the EAS build profile (prod).",
  );
}

if (__DEV__) console.log("[api-client] API_BASE_URL:", API_BASE_URL);

export const api = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 15_000,
  retry: { limit: 2 },
  hooks: {
    beforeRequest: __DEV__
      ? [
          (request) => {
            console.log("[api-client] >>", request.method, request.url);
          },
        ]
      : [],
    afterResponse: __DEV__
      ? [
          (_request, _options, response) => {
            console.log("[api-client] <<", response.status, response.url);
          },
        ]
      : [],
    beforeError: [
      (error) => {
        if (__DEV__) console.warn("[api-client] ERROR:", error.message, error.response?.status, error.request?.url);
        return error;
      },
    ],
  },
});
