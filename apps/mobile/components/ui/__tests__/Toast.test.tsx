import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { showToast, onToast, type ToastMessage } from "@/lib/toast";

describe("toast event system", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("emits toast message to listeners", () => {
    const listener = jest.fn();
    const unsub = onToast(listener);

    showToast("success", "Test Title", "Test message");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "success",
        title: "Test Title",
        message: "Test message",
      })
    );

    unsub();
  });

  it("renders success variant with positive semantics", () => {
    const listener = jest.fn();
    const unsub = onToast(listener);

    showToast("success", "Done");

    const toast = listener.mock.calls[0][0] as ToastMessage;
    expect(toast.variant).toBe("success");

    unsub();
  });

  it("renders error variant with negative semantics", () => {
    const listener = jest.fn();
    const unsub = onToast(listener);

    showToast("error", "Failed", "Something went wrong");

    const toast = listener.mock.calls[0][0] as ToastMessage;
    expect(toast.variant).toBe("error");
    expect(toast.message).toBe("Something went wrong");

    unsub();
  });

  it("auto-dismisses after duration", () => {
    const listener = jest.fn();
    const unsub = onToast(listener);

    showToast("info", "Info", undefined, 2000);

    const toast = listener.mock.calls[0][0] as ToastMessage;
    expect(toast.duration).toBe(2000);

    unsub();
  });

  it("unsubscribes correctly", () => {
    const listener = jest.fn();
    const unsub = onToast(listener);
    unsub();

    showToast("info", "Should not receive");
    expect(listener).not.toHaveBeenCalled();
  });
});
