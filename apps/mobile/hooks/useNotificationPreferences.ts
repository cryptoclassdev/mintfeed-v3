import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";

interface NotificationPreferences {
  marketMovers: boolean;
  breakingNews: boolean;
  predictionSettled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
}

const DEFAULT_PREFS: NotificationPreferences = {
  marketMovers: true,
  breakingNews: true,
  predictionSettled: true,
  quietHoursStart: 23,
  quietHoursEnd: 7,
};

export function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const pushToken = useAppStore((s) => s.expoPushToken);

  const query = useQuery({
    queryKey: ["notification-preferences", pushToken],
    queryFn: async (): Promise<NotificationPreferences> => {
      if (!pushToken) return DEFAULT_PREFS;
      return api
        .get("api/v1/notifications/preferences", {
          searchParams: { token: pushToken },
        })
        .json<NotificationPreferences>();
    },
    enabled: !!pushToken,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!pushToken) return;
      return api
        .put("api/v1/notifications/preferences", {
          json: { expoPushToken: pushToken, ...updates },
        })
        .json();
    },
    onMutate: async (updates) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["notification-preferences", pushToken] });
      const previous = queryClient.getQueryData<NotificationPreferences>([
        "notification-preferences",
        pushToken,
      ]);
      queryClient.setQueryData(
        ["notification-preferences", pushToken],
        (old: NotificationPreferences | undefined) => ({ ...(old ?? DEFAULT_PREFS), ...updates }),
      );
      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notification-preferences", pushToken], context.previous);
      }
    },
  });

  return {
    preferences: query.data ?? DEFAULT_PREFS,
    isLoading: query.isLoading,
    updatePreference: mutation.mutate,
  };
}
