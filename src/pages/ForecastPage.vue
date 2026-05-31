<template>
  <q-page class="gp-page">
    <!-- OmniFocus-style horizontal date strip: scrubbable upcoming days with dots for items. -->
    <div class="gp-forecast-strip">
      <div
        v-if="overdueCount"
        class="gp-forecast-strip__cell gp-forecast-strip__cell--overdue"
        :class="{ 'gp-forecast-strip__cell--active': activeKey === 'overdue' }"
        @click="jump('overdue')"
      >
        <div class="gp-forecast-strip__weekday">OVR</div>
        <div class="gp-forecast-strip__num">{{ overdueCount }}</div>
        <div class="gp-forecast-strip__dot gp-forecast-strip__dot--due"></div>
      </div>
      <div
        v-for="d in days"
        :key="d.key"
        class="gp-forecast-strip__cell"
        :class="{ 'gp-forecast-strip__cell--active': activeKey === d.key, 'gp-forecast-strip__cell--today': d.diff === 0 }"
        @click="jump(d.key)"
      >
        <div class="gp-forecast-strip__weekday">{{ d.weekday.toUpperCase() }}</div>
        <div class="gp-forecast-strip__num">{{ d.day }}</div>
        <div
          v-if="d.count"
          class="gp-forecast-strip__dot"
          :class="d.diff < 0 ? 'gp-forecast-strip__dot--due' : d.diff <= 1 ? 'gp-forecast-strip__dot--soon' : ''"
        ></div>
      </div>
    </div>

    <template v-if="groups.length">
      <div v-for="g in groups" :key="g.key" :ref="(el) => (sectionRefs[g.key] = el)">
        <TaskList :nodes="g.nodes" :title="g.label" show-project />
      </div>
    </template>
    <div v-else class="gp-empty">Nothing scheduled</div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import moment from 'moment';
import wn from '../core/WhatsNext';
import { isDone } from '../core/format';
import { ui } from '../core/ui';
import TaskList from '../components/TaskList.vue';

function dayDiff(ms: number) {
  return moment(ms).startOf('day').diff(moment().startOf('day'), 'days');
}

function bucket(diff: number, ms: number): { key: string; label: string; order: number } {
  if (diff < 0) return { key: 'overdue', label: 'Overdue', order: -1 };
  if (diff === 0) return { key: 'today', label: 'Today', order: 0 };
  if (diff === 1) return { key: 'tomorrow', label: 'Tomorrow', order: 1 };
  return { key: moment(ms).format('YYYY-MM-DD'), label: moment(ms).format('ddd, MMM D'), order: diff };
}

const items = computed(() =>
  wn.all_nodes().filter((n: any) => !n.isProject && n.due >= 0 && (ui.showCompleted || !isDone(n)))
);

const groups = computed(() => {
  const map = new Map<string, { key: string; label: string; order: number; nodes: any[] }>();
  for (const n of items.value) {
    const b = bucket(dayDiff(n.due), n.due);
    if (!map.has(b.key)) map.set(b.key, { ...b, nodes: [] });
    map.get(b.key)!.nodes.push(n);
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
});

const overdueCount = computed(() => items.value.filter((n) => dayDiff(n.due) < 0).length);

// 7-day strip starting today; map each day to the same key the groups use so
// the strip and the sections stay in sync.
const days = computed(() => {
  const today = moment().startOf('day');
  return Array.from({ length: 7 }, (_, i) => {
    const d = today.clone().add(i, 'days');
    const key = i === 0 ? 'today' : i === 1 ? 'tomorrow' : d.format('YYYY-MM-DD');
    const count = items.value.filter((n) => moment(n.due).startOf('day').isSame(d)).length;
    return { key, weekday: d.format('ddd'), day: d.format('D'), diff: i, count };
  });
});

const sectionRefs: Record<string, any> = {};
const activeKey = ref<string>('today');
function jump(key: string) {
  activeKey.value = key;
  const el = sectionRefs[key];
  if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<style>
.gp-forecast-strip {
  display: flex;
  gap: 6px;
  padding: 10px 12px;
  overflow-x: auto;
  background: var(--gp-row);
  border-bottom: 0.5px solid var(--gp-sep);
  scroll-snap-type: x mandatory;
}
.gp-forecast-strip__cell {
  position: relative;
  flex: 0 0 auto;
  min-width: 52px;
  text-align: center;
  padding: 6px 10px 12px;
  border-radius: 10px;
  background: rgba(120, 120, 128, 0.1);
  scroll-snap-align: start;
  cursor: pointer;
  transition: background var(--gp-dur) var(--gp-ease);
}
.gp-forecast-strip__cell:hover,
.gp-forecast-strip__cell:active {
  background: rgba(120, 120, 128, 0.2);
}
.gp-forecast-strip__cell--today {
  background: rgba(108, 79, 224, 0.16);
}
.gp-forecast-strip__cell--active {
  outline: 2px solid var(--q-primary);
}
.gp-forecast-strip__cell--overdue {
  background: rgba(255, 59, 48, 0.16);
}
.gp-forecast-strip__weekday {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: var(--gp-text-2);
}
.gp-forecast-strip__num {
  font-size: 19px;
  font-weight: 700;
  color: var(--gp-text);
  line-height: 1.1;
  margin-top: 1px;
}
.gp-forecast-strip__cell--today .gp-forecast-strip__num,
.gp-forecast-strip__cell--overdue .gp-forecast-strip__num {
  color: var(--q-primary);
}
.gp-forecast-strip__cell--overdue .gp-forecast-strip__num {
  color: #ff453a;
}
.gp-forecast-strip__dot {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--q-primary);
}
.gp-forecast-strip__dot--due {
  background: #ff453a;
}
.gp-forecast-strip__dot--soon {
  background: #ff9f0a;
}
</style>
