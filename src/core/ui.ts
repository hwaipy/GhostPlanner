import { reactive } from 'vue';

// Lightweight UI preferences, persisted to localStorage.
const KEY = 'gp-ui';
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
})();

export const ui = reactive({
  showCompleted: saved.showCompleted ?? false,
  dark: saved.dark ?? false,
});

export function persistUi() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ showCompleted: ui.showCompleted, dark: ui.dark }));
  } catch {
    /* ignore */
  }
}
