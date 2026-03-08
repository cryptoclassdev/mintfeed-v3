import { describe, expect, it } from "@jest/globals";
import {
  getNewsCardBottomPadding,
  getTabBarHeight,
  NEWS_CARD_BOTTOM_BREATHING_ROOM,
  TAB_BAR_BASE_HEIGHT,
} from "../news-card-layout";

describe("news card layout spacing", () => {
  it("keeps card content above the tab bar plus breathing room", () => {
    expect(getNewsCardBottomPadding(0)).toBe(
      TAB_BAR_BASE_HEIGHT + NEWS_CARD_BOTTOM_BREATHING_ROOM,
    );
    expect(getNewsCardBottomPadding(34)).toBe(
      TAB_BAR_BASE_HEIGHT + 34 + NEWS_CARD_BOTTOM_BREATHING_ROOM,
    );
  });

  it("uses the same base height for the actual tab bar", () => {
    expect(getTabBarHeight(0)).toBe(TAB_BAR_BASE_HEIGHT);
    expect(getTabBarHeight(34)).toBe(TAB_BAR_BASE_HEIGHT + 34);
  });
});
