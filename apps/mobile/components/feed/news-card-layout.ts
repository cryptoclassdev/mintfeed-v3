export const TAB_BAR_BASE_HEIGHT = 64;
export const NEWS_CARD_BOTTOM_BREATHING_ROOM = 24;

export function getNewsCardBottomPadding(safeBottom: number): number {
  return TAB_BAR_BASE_HEIGHT + safeBottom + NEWS_CARD_BOTTOM_BREATHING_ROOM;
}

export function getTabBarHeight(safeBottom: number): number {
  return TAB_BAR_BASE_HEIGHT + safeBottom;
}

/**
 * Returns an adaptive image height ratio based on screen height.
 * Smaller screens get less image space to leave room for content.
 */
export function getImageHeightRatio(screenHeight: number): number {
  if (screenHeight < 700) return 0.22;
  if (screenHeight < 800) return 0.25;
  return 0.28;
}

// Fixed layout heights for content zone elements (px)
const ACCENT_LINE_HEIGHT = 3 + 12; // height + marginBottom
const TITLE_HEIGHT_BUDGET = 3 * 30 + 10; // 3 lines max * lineHeight + marginBottom
const META_ROW_HEIGHT = 50; // minHeight 40 + marginBottom 10
const SUMMARY_LINE_HEIGHT = 24;
const SUMMARY_MARGIN_BOTTOM = 8;
const MARKETS_HEADER_HEIGHT = 18; // icon + label
const MARKETS_SECTION_OVERHEAD = 4 + 6; // marginTop + gap
const MARKET_CARD_HEIGHT = 46; // min 40 + gap 6 between cards
const MIN_SUMMARY_LINES = 2;
const MAX_SUMMARY_LINES = 6;

/**
 * Calculates the maximum number of summary lines that fit without
 * pushing markets into the tab bar area.
 */
export function getMaxSummaryLines(params: {
  screenHeight: number;
  safeBottom: number;
  marketCount: number;
}): number {
  const { screenHeight, safeBottom, marketCount } = params;
  const imageHeight = screenHeight * getImageHeightRatio(screenHeight);
  const contentZoneHeight = screenHeight - imageHeight;
  const bottomPadding = getNewsCardBottomPadding(safeBottom);
  const availableHeight = contentZoneHeight - bottomPadding;

  const marketsHeight =
    marketCount > 0
      ? MARKETS_HEADER_HEIGHT + MARKETS_SECTION_OVERHEAD + marketCount * MARKET_CARD_HEIGHT
      : 0;

  const fixedHeight =
    ACCENT_LINE_HEIGHT + TITLE_HEIGHT_BUDGET + META_ROW_HEIGHT + SUMMARY_MARGIN_BOTTOM + marketsHeight;

  const remainingForSummary = availableHeight - fixedHeight;
  const lines = Math.floor(remainingForSummary / SUMMARY_LINE_HEIGHT);

  return Math.max(MIN_SUMMARY_LINES, Math.min(MAX_SUMMARY_LINES, lines));
}
