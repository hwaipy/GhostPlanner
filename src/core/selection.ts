import { ref } from 'vue';

// uid of the task shown in the desktop inspector drawer (>= gt.md screens).
export const selectedTaskUid = ref<string | null>(null);

// uid of the row currently expanded inline (fluid-outline editor); null = none.
export const expandedTaskUid = ref<string | null>(null);

export function clearSelection() {
  selectedTaskUid.value = null;
  expandedTaskUid.value = null;
}
