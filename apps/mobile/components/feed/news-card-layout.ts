export const TAB_BAR_BASE_HEIGHT = 64;
export const NEWS_CARD_BOTTOM_BREATHING_ROOM = 24;

export function getNewsCardBottomPadding(safeBottom: number): number {
  return TAB_BAR_BASE_HEIGHT + safeBottom + NEWS_CARD_BOTTOM_BREATHING_ROOM;
}

export function getTabBarHeight(safeBottom: number): number {
  return TAB_BAR_BASE_HEIGHT + safeBottom;
}
