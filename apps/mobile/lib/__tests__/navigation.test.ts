import { closeModal } from "../navigation";

describe("closeModal", () => {
  it("goes back when a navigator history is available", () => {
    const router = {
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
      replace: jest.fn(),
    };

    closeModal(router);

    expect(router.canGoBack).toHaveBeenCalled();
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("falls back to the tabs route when there is no back stack", () => {
    const router = {
      back: jest.fn(),
      canGoBack: jest.fn(() => false),
      replace: jest.fn(),
    };

    closeModal(router);

    expect(router.canGoBack).toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("falls back when canGoBack is unavailable", () => {
    const router = {
      back: jest.fn(),
      replace: jest.fn(),
    };

    closeModal(router);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });
});
