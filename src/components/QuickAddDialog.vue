<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" position="bottom" @show="focusInput">
    <q-card class="gp-add-card">
      <q-card-section class="q-pb-none">
        <q-input
          ref="inputRef"
          v-model="title"
          :placeholder="type === 'project' ? 'New project' : 'New action'"
          autofocus
          dense
          outlined
          @keyup.enter="add"
        />
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <q-btn-toggle
          v-model="type"
          spread
          no-caps
          unelevated
          toggle-color="primary"
          :options="[
            { label: 'Action', value: 'action' },
            { label: 'Project', value: 'project' },
          ]"
        />
        <q-select v-model="target" :options="targetOptions" dense outlined emit-value map-options label="Add to" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Done" v-close-popup />
        <q-btn unelevated color="primary" label="Add" :disable="!title.trim()" @click="add" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import wn from '../core/WhatsNext';
import { INBOX_ID } from '../core/types';

const props = defineProps<{ modelValue: boolean; contextProject: string | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();
const $q = useQuasar();

const title = ref('');
const type = ref<'action' | 'project'>('action');
const target = ref<string | null>(null);
const inputRef = ref<any>(null);

const projectOptions = computed(() =>
  wn
    .all_nodes()
    .filter((n: any) => n.isProject && n.label !== INBOX_ID)
    .map((n: any) => ({ label: n.title || 'Untitled', value: n.label }))
);
const targetOptions = computed(() => {
  if (type.value === 'project') return [{ label: 'Top level', value: null }, ...projectOptions.value];
  return [{ label: 'Inbox', value: INBOX_ID }, ...projectOptions.value];
});

function defaultTarget() {
  const ctx = props.contextProject;
  if (type.value === 'project') return ctx && wn.get_task_node(ctx)?.isProject ? ctx : null;
  return ctx || INBOX_ID;
}

watch(type, () => {
  target.value = defaultTarget();
});
watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      type.value = 'action';
      target.value = defaultTarget();
      title.value = '';
    }
  }
);

function focusInput() {
  nextTick(() => inputRef.value?.focus());
}

function add() {
  const t = title.value.trim();
  if (!t) return;
  try {
    if (target.value === INBOX_ID && type.value === 'action') wn.add_to_inbox(t);
    else wn.create_task({ title: t, isProject: type.value === 'project', parent: target.value });
    title.value = '';
    focusInput();
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.message || 'Could not add', position: 'top' });
  }
}

void emit; // suppress unused warning
</script>

<style scoped>
.gp-add-card {
  width: 100%;
  max-width: 560px;
  border-radius: 16px 16px 0 0;
}
</style>
