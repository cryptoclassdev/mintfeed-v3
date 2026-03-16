type ToastVariant = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
  /** If set, tapping the toast calls this instead of dismissing */
  onTap?: () => void;
}

type ToastListener = (toast: ToastMessage) => void;

const listeners = new Set<ToastListener>();
let nextId = 0;

function emit(toast: ToastMessage) {
  listeners.forEach((fn) => fn(toast));
}

export function showToast(
  variant: ToastVariant,
  title: string,
  message?: string,
  duration = 3000,
  onTap?: () => void,
) {
  emit({ id: String(++nextId), variant, title, message, duration, onTap });
}

export function onToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type { ToastMessage, ToastVariant };
