<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" position="top" @show="focusInput">
    <q-card class="gp-search-card">
      <q-card-section class="q-pb-none">
        <q-input
          ref="inputRef"
          v-model="query"
          dense
          outlined
          autofocus
          placeholder="Search projects, tasks, tags…"
          @keydown.escape="$emit('update:modelValue', false)"
          @keydown.enter="pickFirst"
        >
          <template v-slot:prepend><q-icon name="search" /></template>
        </q-input>
      </q-card-section>

      <q-list separator class="gp-search-list">
        <q-item v-for="r in results" :key="r.type + ':' + r.key" clickable v-close-popup @click="go(r)">
          <q-item-section avatar>
            <q-icon :name="r.icon" :color="r.color" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ r.label }}</q-item-label>
            <q-item-label caption>{{ r.hint }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="!results.length" class="gp-empty" style="padding: 20px">
          {{ query ? 'No matches' : 'Type to search' }}
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import wn from '../core/WhatsNext';
import { INBOX_ID } from '../core/types';
import { usePerspectives } from '../core/perspectives';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();
const router = useRouter();
const perspectives = usePerspectives();

const query = ref('');
const inputRef = ref<any>(null);
function focusInput() {
  nextTick(() => inputRef.value?.focus());
}

interface Result {
  type: 'perspective' | 'project' | 'task' | 'tag';
  key: string;
  label: string;
  hint: string;
  icon: string;
  color: string;
  to: any;
}

const results = computed<Result[]>(() => {
  const q = query.value.trim().toLowerCase();
  const out: Result[] = [];
  if (!q) {
    for (const p of perspectives.value) {
      out.push({ type: 'perspective', key: p.name, label: p.label, hint: 'Perspective', icon: p.icon, color: 'primary', to: p.to });
    }
    return out.slice(0, 10);
  }
  // perspectives
  for (const p of perspectives.value) {
    if (p.label.toLowerCase().includes(q)) {
      out.push({ type: 'perspective', key: p.name, label: p.label, hint: 'Perspective', icon: p.icon, color: 'primary', to: p.to });
    }
  }
  // tags
  for (const t of wn.tags) {
    if (t.toLowerCase().includes(q)) {
      out.push({ type: 'tag', key: t, label: '#' + t, hint: 'Tag', icon: 'local_offer', color: 'teal', to: { name: 'tag', params: { name: t } } });
    }
  }
  // nodes
  for (const n of wn.all_nodes()) {
    const title = (n.title || '').toLowerCase();
    if (!title.includes(q)) continue;
    if (n.isProject) {
      out.push({
        type: 'project',
        key: n.label,
        label: n.title || 'Untitled',
        hint: n.label === INBOX_ID ? 'Inbox' : 'Project',
        icon: 'workspaces',
        color: 'primary',
        to: { name: 'project', params: { uid: n.label } },
      });
    } else {
      out.push({
        type: 'task',
        key: n.label,
        label: n.title || 'Untitled',
        hint: n.parent?.title ? 'in ' + n.parent.title : 'Action',
        icon: 'radio_button_unchecked',
        color: 'grey-7',
        to: { name: 'task', params: { uid: n.label } },
      });
    }
  }
  return out.slice(0, 30);
});

function go(r: Result) {
  query.value = '';
  router.push(r.to);
  emit('update:modelValue', false);
}
function pickFirst() {
  if (results.value[0]) go(results.value[0]);
}
</script>

<style>
.gp-search-card {
  width: 100%;
  max-width: 560px;
  margin-top: 64px;
  border-radius: 14px;
  overflow: hidden;
}
.gp-search-list {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
