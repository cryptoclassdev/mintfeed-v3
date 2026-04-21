export interface ModalRouter {
  back: () => void;
  canGoBack?: () => boolean;
  replace: (href: string) => void;
}

const FALLBACK_ROUTE = "/(tabs)";

export function closeModal(router: ModalRouter, fallbackRoute = FALLBACK_ROUTE) {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }

  router.replace(fallbackRoute);
}
