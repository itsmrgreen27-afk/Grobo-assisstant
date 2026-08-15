// Lightweight window-event bus so global shortcuts can drive the mounted
// timer / pomodoro panel without lifting all of their internal state.

/** Fired when the user presses Space to play / pause the active countdown. */
export const TOGGLE_PLAY_EVENT = 'robo:toggle-play'

/** Ask the currently mounted timer / pomodoro panel to toggle its running state. */
export function requestTogglePlay() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TOGGLE_PLAY_EVENT))
}
