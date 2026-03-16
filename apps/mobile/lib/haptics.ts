import * as Haptics from 'expo-haptics';
import { useAppStore } from './store';

/**
 * Centralized haptic feedback utility.
 * Respects the user's hapticsEnabled preference from the store.
 */

function isEnabled(): boolean {
  return useAppStore.getState().hapticsEnabled;
}

/** Lightest tap — navigation, toggles, selections */
export function selection() {
  if (!isEnabled()) return;
  Haptics.selectionAsync();
}

/** Light impact — small confirmations, card presses */
export function lightImpact() {
  if (!isEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium impact — actions with consequence */
export function mediumImpact() {
  if (!isEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy impact — major confirmations */
export function heavyImpact() {
  if (!isEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Success notification — positive outcomes */
export function success() {
  if (!isEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning notification — attention needed */
export function warning() {
  if (!isEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Error notification — failures */
export function error() {
  if (!isEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
