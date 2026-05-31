<template>
  <div v-if="node">
    <div class="gp-list q-mt-md">
      <div class="gp-detail-field">
        <q-input v-model="title" borderless placeholder="Title" class="gp-title-input" autogrow />
      </div>
    </div>

    <div class="gp-list">
      <q-item>
        <q-item-section>Status</q-item-section>
        <q-item-section side>
          <q-btn-toggle
            v-model="status"
            no-caps
            unelevated
            size="sm"
            toggle-color="primary"
            :options="[
              { value: 'Active', slot: 'a' },
              { value: 'Completed', slot: 'c' },
              { value: 'Dropped', slot: 'd' },
            ]"
          >
            <template v-slot:a><q-icon name="play_arrow" /></template>
            <template v-slot:c><q-icon name="done" /></template>
            <template v-slot:d><q-icon name="hide_source" /></template>
          </q-btn-toggle>
        </q-item-section>
      </q-item>
      <q-item tag="label">
        <q-item-section>Flagged</q-item-section>
        <q-item-section side><q-toggle v-model="flagged" color="amber-7" /></q-item-section>
      </q-item>
      <q-item v-if="node.isProject">
        <q-item-section>Type</q-item-section>
        <q-item-section side>
          <q-btn-toggle
            v-model="parallel"
            no-caps
            unelevated
            size="sm"
            toggle-color="primary"
            :options="[
              { label: 'Parallel', value: true },
              { label: 'Sequential', value: false },
            ]"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>{{ node.isProject ? 'Parent' : 'Project' }}</q-item-section>
        <q-item-section side style="min-width: 160px">
          <q-select :model-value="parentSel" :options="parentOptions" dense borderless emit-value map-options @update:model-value="onMove" />
        </q-item-section>
      </q-item>
    </div>

    <div class="gp-list">
      <q-item>
        <q-item-section>
          <q-item-label caption>Tags</q-item-label>
          <q-select
            v-model="tags"
            multiple
            use-chips
            use-input
            new-value-mode="add-unique"
            hide-dropdown-icon
            borderless
            dense
            :options="tagOptions"
            @filter="filterTags"
            placeholder="Add tag"
          />
        </q-item-section>
      </q-item>
    </div>

    <div class="gp-list">
      <q-item>
        <q-item-section>
          <q-item-label caption>Defer until</q-item-label>
          <DateInputPanel :node="node" :value="node.deferUntil" :set-value="(v) => node.set_property('deferUntil', v)" />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Due</q-item-label>
          <DateInputPanel :node="node" :value="node.due" :set-value="(v) => node.set_property('due', v)" />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Estimated duration</q-item-label>
          <DurationInput :node="node" :value="node.estimatedDuration" :set-value="(v) => node.set_property('estimatedDuration', v)" />
        </q-item-section>
      </q-item>
    </div>

    <div class="gp-list">
      <q-item>
        <q-item-section>
          <q-item-label caption>Note</q-item-label>
          <q-input v-model="note" borderless type="textarea" autogrow placeholder="Add a note…" />
        </q-item-section>
      </q-item>
    </div>

    <div class="q-pa-md">
      <q-btn flat color="negative" icon="delete" label="Delete" class="full-width" @click="onDelete" />
    </div>
  </div>
  <div v-else class="gp-empty">No selection.</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import wn from '../core/WhatsNext';
import { INBOX_ID } from '../core/types';
import DateInputPanel from '../view/projectview/components/DateInputPanel.vue';
import DurationInput from '../view/projectview/components/DurationInput.vue';

const props = defineProps<{ node: any }>();
const emit = defineEmits<{ (e: 'deleted'): void }>();

function field(key: string) {
  return computed({
    get: () => (props.node as any)?.[key],
    set: (v) => props.node && props.node.set_property(key, v),
  });
}
const title = field('title');
const note = field('note');
const status = field('status');
const flagged = field('flagged');
const parallel = field('parallel');
const tags = field('tags');

const tagOptions = ref<string[]>([...wn.tags]);
function filterTags(val: string, update: (cb: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    tagOptions.value = wn.tags.filter((t: string) => t.toLowerCase().includes(needle));
  });
}

const parentOptions = computed(() => {
  const projects = wn
    .all_nodes()
    .filter((n: any) => n.isProject && n.label !== props.node?.label)
    .map((n: any) => ({ label: (n.label === INBOX_ID ? 'Inbox' : n.title) || 'Untitled', value: n.label }));
  if (props.node?.isProject) return [{ label: 'Top level', value: null }, ...projects];
  return projects;
});
const parentSel = computed(() => props.node?.parent?.label ?? null);

function onMove(val: string | null) {
  if (!props.node) return;
  try {
    const parent = val ? wn.get_task_node(val) : null;
    const index = parent ? parent.children.length : wn.task_model.value.children.length;
    wn.move_task(props.node.label, val, index);
  } catch {
    /* illegal placement ignored */
  }
}

function onDelete() {
  if (!props.node) return;
  wn.delete_task(props.node.label);
  emit('deleted');
}
</script>

<style>
.gp-title-input {
  font-size: 18px;
  font-weight: 600;
}
.gp-detail-field {
  padding: 6px 14px;
}
</style>
