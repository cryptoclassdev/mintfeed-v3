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

interface ToastUpdate {
  id: string;
  variant?: ToastVariant;
  title?: string;
  message?: string | null;
  duration?: number;
  onTap?: (() => void) | null;
}

type ToastListener = (toast: ToastMessage) => void;
type ToastUpdateListener = (update: ToastUpdate) => void;

const listeners = new Set<ToastListener>();
const updateListeners = new Set<ToastUpdateListener>();
let nextId = 0;

function emit(toast: ToastMessage) {
  listeners.forEach((fn) => fn(toast));
}

function emitUpdate(update: ToastUpdate) {
  updateListeners.forEach((fn) => fn(update));
}

/**
 * Show a new toast. Returns the toast ID for later updates.
 */
export function showToast(
  variant: ToastVariant,
  title: string,
  message?: string,
  duration = 3000,
  onTap?: () => void,
): string {
  const id = String(++nextId);
  emit({ id, variant, title, message, duration, onTap });
  return id;
}

/**
 * Update an existing toast in-place without re-animating.
 * Only updates fields that are provided.
 */
export function updateToast(
  id: string,
  updates: Omit<ToastUpdate, "id">,
) {
  emitUpdate({ id, ...updates });
}

export function onToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function onToastUpdate(listener: ToastUpdateListener): () => void {
  updateListeners.add(listener);
  return () => updateListeners.delete(listener);
}

export type { ToastMessage, ToastVariant, ToastUpdate };
