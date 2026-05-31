<template>
  <div class="gp-row">
    <q-slide-item right-color="negative" left-color="amber-8" @right="onDelete" @left="onFlag" class="gp-slide">
      <template v-slot:left>
        <q-icon name="flag" /> Flag
      </template>
      <template v-slot:right>
        <q-icon name="delete" /> Delete
      </template>

      <div class="gp-item" :class="{ 'gp-item--selected': isSelected }" @click="onRowClick">
        <!-- completion circle (actions) or project glyph -->
        <q-icon
          v-if="!node.isProject"
          class="gp-circle"
          :name="circleIcon"
          :color="circleColor"
          size="24px"
          @click.stop="wn.toggle_complete(node.label)"
        />
        <q-icon v-else class="gp-circle" :name="projectIcon" color="primary" size="22px" />

        <div class="gp-item__main">
          <div class="gp-item__title" :class="{ 'gp-item__title--done': done }">{{ node.title || 'Untitled' }}</div>
          <div v-if="badges.length || node.note" class="gp-item__meta">
            <q-icon v-if="node.note" name="notes" size="13px" class="gp-badge--tag" />
            <span
              v-for="(b, i) in badges"
              :key="i"
              class="gp-badge"
              :class="b.cls"
              :style="b.color ? ('--gp-proj:' + b.color) : undefined"
            >{{ b.text }}</span>
          </div>
        </div>

        <q-icon v-if="node.flagged" name="flag" color="amber-7" size="18px" />
        <template v-if="node.isProject || node.children.length">
          <span class="gp-tile__count">{{ availableCount }}</span>
          <q-icon name="chevron_right" color="grey-5" size="22px" @click.stop="drill" />
        </template>
      </div>
    </q-slide-item>

    <!-- Inline ("fluid outline") editor for actions on phone/tablet. -->
    <q-slide-transition>
      <div v-if="isExpanded" class="gp-row__inline">
        <InspectorContent :node="node" @deleted="onInlineDeleted" />
      </div>
    </q-slide-transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import wn from '../core/WhatsNext';
import { dueBadge, deferBadge, fmtDuration, isAvailable, isDone } from '../core/format';
import { selectedTaskUid, expandedTaskUid } from '../core/selection';
import InspectorContent from './InspectorContent.vue';

const props = defineProps<{ node: any; showProject?: boolean }>();
const router = useRouter();
const $q = useQuasar();

const done = computed(() => isDone(props.node));
const hasSubProject = computed(() => props.node.children.some((c: any) => c.isProject));
const availableCount = computed(() => props.node.children.filter((c: any) => isAvailable(c)).length || '');

const isDesktop = computed(() => $q.screen.gt.md);
const isSelected = computed(() => isDesktop.value && selectedTaskUid.value === props.node.label);
const isExpanded = computed(() => !isDesktop.value && !props.node.isProject && expandedTaskUid.value === props.node.label);

const circleIcon = computed(() => {
  if (props.node.status === 'Completed') return 'check_circle';
  if (props.node.status === 'Dropped') return 'cancel';
  return 'radio_button_unchecked';
});
const circleColor = computed(() => {
  if (props.node.status === 'Completed') return 'primary';
  if (props.node.status === 'Dropped') return 'grey-5';
  return 'grey-5';
});

// OmniFocus-style project glyphs: folder for groups containing sub-projects,
// "playlist_play" for sequential (numbered list feel), "view_stream" for parallel.
const projectIcon = computed(() => {
  if (hasSubProject.value) return 'folder';
  return props.node.parallel === false ? 'playlist_play' : 'view_stream';
});

function projectColor(uid: string) {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360}, 70%, 52%)`;
}

interface Badge {
  text: string;
  cls: string;
  color?: string;
}

const badges = computed<Badge[]>(() => {
  const out: Badge[] = [];
  if (props.showProject && props.node.parent && !props.node.parent.isRoot) {
    const proj = props.node.get_project_node();
    out.push({ text: proj.title, cls: 'gp-badge--project', color: projectColor(proj.label) });
  }
  const due = dueBadge(props.node.due);
  if (due) out.push(due);
  const defer = deferBadge(props.node.deferUntil);
  if (defer) out.push(defer);
  for (const t of props.node.tags) out.push({ text: t, cls: 'gp-badge--tag' });
  const dur = fmtDuration(props.node.estimatedDuration);
  if (dur) out.push({ text: dur, cls: 'gp-badge--tag' });
  return out;
});

function drill() {
  router.push({ name: 'project', params: { uid: props.node.label } });
}

function onRowClick() {
  if (props.node.isProject) {
    drill();
    return;
  }
  if (isDesktop.value) {
    // Master-detail: toggle selection in the right inspector drawer.
    selectedTaskUid.value = selectedTaskUid.value === props.node.label ? null : props.node.label;
    return;
  }
  // Fluid outline on phone/tablet: tap to inline-expand, tap again to collapse.
  expandedTaskUid.value = expandedTaskUid.value === props.node.label ? null : props.node.label;
}

function onInlineDeleted() {
  expandedTaskUid.value = null;
}

function onDelete(details: any) {
  wn.delete_task(props.node.label);
  details.reset();
}
function onFlag(details: any) {
  wn.set_property(props.node.label, 'flagged', !props.node.flagged);
  details.reset();
}
</script>

<style>
.gp-row {
  background: var(--gp-row);
}
.gp-item--selected {
  background: var(--gp-row-press);
}
.gp-row__inline {
  background: var(--gp-bg);
  border-top: 0.5px solid var(--gp-sep);
  padding-bottom: 4px;
}
.gp-slide :deep(.q-slide-item__content) {
  padding: 0;
}
</style>
