type ToastVariant = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;

const listeners = new Set<ToastListener>();
let nextId = 0;

function emit(toast: ToastMessage) {
  listeners.forEach((fn) => fn(toast));
}

export function showToast(variant: ToastVariant, title: string, message?: string, duration = 3000) {
  emit({ id: String(++nextId), variant, title, message, duration });
}

export function onToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type { ToastMessage, ToastVariant };
