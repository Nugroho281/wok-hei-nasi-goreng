// Keyboard and pointer input. Held keys give a steering direction; one-shot presses (act,
// pause, dump the tray, pick an ingredient) are queued as bit flags or lists and taken once
// by the loop, so a press between two frames is never lost and never counted twice. Pointer
// clicks are reported with their canvas coordinates for the caller to map onto bins, stations
// and buttons.
import { INGREDIENTS } from './recipes.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_DUMP = 4;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const DUMP = new Set(['KeyX', 'Backspace']);
const DIGITS = {};
for (const ingredient of INGREDIENTS) DIGITS[`Digit${ingredient.key}`] = ingredient.id;

export function createInput(target) {
  let left = false;
  let right = false;
  let actions = 0;
  let selects = [];
  let clicks = [];

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (DUMP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_DUMP;
    } else if (DIGITS[event.code]) {
      if (!event.repeat) selects.push(DIGITS[event.code]);
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    left = false;
    right = false;
  });
  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    clicks.push({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  });

  return {
    /** -1 for left, 1 for right, 0 for neither or both. */
    direction() {
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Ingredient ids picked with the number keys since the last call. */
    takeSelects() {
      const taken = selects;
      selects = [];
      return taken;
    },
    /** Pointer clicks since the last call, in canvas CSS pixels. */
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
  };
}
