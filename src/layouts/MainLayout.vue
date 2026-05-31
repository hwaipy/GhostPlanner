<template>
  <LoginView v-if="!auth.token" />
  <q-layout v-else :view="layoutView">
    <q-header elevated class="gp-header">
      <q-toolbar>
        <q-btn v-if="canBack" flat dense round icon="arrow_back_ios" size="sm" @click="goBack" />
        <q-icon v-else name="workspaces" size="22px" color="primary" class="q-mr-sm" />
        <q-toolbar-title class="gp-header__title">{{ title }}</q-toolbar-title>

        <q-btn
          flat
          dense
          no-caps
          class="gp-filter-chip q-mr-xs"
          :icon="ui.showCompleted ? 'visibility' : 'filter_alt'"
          @click="toggleFilter"
        >
          {{ ui.showCompleted ? 'All' : 'Available' }}
        </q-btn>

        <q-btn flat round dense icon="search" @click="showSearch = true">
          <q-tooltip>Search</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="add" @click="showAdd = true">
          <q-tooltip>Quick add</q-tooltip>
        </q-btn>
        <q-btn flat round dense :icon="syncView.icon" :loading="syncStatus === 'syncing'" @click="wn.sync()">
          <q-tooltip>{{ syncView.text }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="more_horiz">
          <q-menu>
            <q-list style="min-width: 220px">
              <q-item tag="label" clickable>
                <q-item-section>Dark mode</q-item-section>
                <q-item-section side>
                  <q-toggle v-model="ui.dark" @update:model-value="onDark" color="primary" />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="$router.push('/review')">
                <q-item-section avatar><q-icon name="rate_review" /></q-item-section>
                <q-item-section>Review</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="forceRefresh">
                <q-item-section avatar><q-icon name="refresh" /></q-item-section>
                <q-item-section>Force refresh</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Left perspectives sidebar (>= sm). Phone uses the bottom tab bar. -->
    <q-drawer v-if="!isPhone" :model-value="true" :width="sidebarWidth" bordered class="gp-sidebar">
      <div class="gp-sidebar__list">
        <div
          v-for="p in perspectives"
          :key="p.name"
          class="gp-sidebar__row"
          :class="{ 'gp-sidebar__row--active': isActiveRoute(p.to) }"
          @click="$router.push(p.to)"
        >
          <div class="gp-sidebar__icon" :style="{ background: p.color }">
            <q-icon :name="p.icon" size="16px" />
          </div>
          <div class="gp-sidebar__label">{{ p.label }}</div>
          <div v-if="p.count" class="gp-sidebar__count">{{ p.count }}</div>
        </div>
      </div>
    </q-drawer>

    <!-- Right inspector drawer (master-detail) on big screens. -->
    <q-drawer
      v-if="hasInspector"
      :model-value="!!selectedTaskUid"
      side="right"
      :width="360"
      bordered
      class="gp-inspector"
    >
      <div class="gp-inspector__head">
        <span>Inspector</span>
        <q-btn flat dense round icon="close" size="sm" @click="selectedTaskUid = null" />
      </div>
      <InspectorContent :node="selectedNode" @deleted="selectedTaskUid = null" />
    </q-drawer>

    <q-page-container>
      <div class="gp-shell" :class="{ 'gp-shell--tabbar': isPhone }">
        <router-view v-slot="{ Component }">
          <transition :name="transition">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </q-page-container>

    <BottomTabBar v-if="isPhone" />
    <QuickAddDialog v-model="showAdd" :context-project="contextProject" />
    <SearchDialog v-model="showSearch" />
  </q-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import wn from '../core/WhatsNext';
import { ui, persistUi } from '../core/ui';
import { auth } from '../core/auth';
import { usePerspectives } from '../core/perspectives';
import { selectedTaskUid, expandedTaskUid, clearSelection } from '../core/selection';
import BottomTabBar from '../components/BottomTabBar.vue';
import QuickAddDialog from '../components/QuickAddDialog.vue';
import SearchDialog from '../components/SearchDialog.vue';
import InspectorContent from '../components/InspectorContent.vue';
import LoginView from '../components/LoginView.vue';

if (import.meta.env.DEV) window.wn = wn;

let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  wn.init();
}
watch(() => auth.token, (t) => t && boot(), { immediate: true });

const $q = useQuasar();
$q.dark.set(ui.dark);
function onDark(v) {
  $q.dark.set(v);
  persistUi();
}
function toggleFilter() {
  ui.showCompleted = !ui.showCompleted;
  persistUi();
}

const route = useRoute();
const router = useRouter();
const perspectives = usePerspectives();

const isPhone = computed(() => $q.screen.lt.sm);
const hasInspector = computed(() => $q.screen.gt.md);
const sidebarWidth = computed(() => ($q.screen.gt.md ? 240 : 200));
const layoutView = computed(() => (hasInspector.value ? 'lHh LpR lFf' : 'lHh Lpr lFf'));

const canBack = computed(() => ['project', 'task', 'tag'].includes(String(route.name)));

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push('/');
}

function isActiveRoute(to) {
  return route.path === to || (to !== '/' && route.path.startsWith(to));
}

const title = computed(() => {
  if (route.name === 'project') return wn.get_task_node(route.params.uid)?.title || 'Project';
  if (route.name === 'tag') return '#' + route.params.name;
  if (route.name === 'task') return wn.get_task_node(route.params.uid)?.isProject ? 'Project' : 'Action';
  const active = perspectives.value.find((p) => p.to === route.path);
  return active?.label || route.meta.title || 'Ghost Planner';
});

const contextProject = computed(() => (route.name === 'project' ? String(route.params.uid) : null));
const selectedNode = computed(() => (selectedTaskUid.value ? wn.get_task_node(selectedTaskUid.value) : null));

const showAdd = ref(false);
const showSearch = ref(false);
const transition = computed(() => 'gp-slide');
watch(() => ui.dark, (v) => $q.dark.set(v));

// Clear selection + inline expansion when the perspective changes, so opening
// e.g. Forecast doesn't keep an inspector pointing at a Project Page item.
watch(() => route.path, () => clearSelection());

const syncStatus = computed(() => wn.syncStatus.value);
const syncView = computed(() => {
  switch (syncStatus.value) {
    case 'syncing':
      return { icon: 'sync', text: 'Syncing…' };
    case 'offline':
      return { icon: 'cloud_off', text: 'Offline — saved locally' };
    case 'error':
      return { icon: 'sync_problem', text: 'Sync failed — tap to retry' };
    default:
      return { icon: 'cloud_done', text: 'Synced' };
  }
});

async function forceRefresh() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn('Force refresh cleanup failed:', e);
  }
  location.reload();
}
</script>

<style>
.gp-header {
  background: var(--gp-header-bg);
  backdrop-filter: var(--gp-header-blur);
  -webkit-backdrop-filter: var(--gp-header-blur);
  color: var(--gp-text);
  border-bottom: 0.5px solid var(--gp-sep);
}
.gp-header__title {
  font-weight: 700;
  font-size: 17px;
}
.gp-filter-chip {
  font-size: 12px;
  font-weight: 600;
  border-radius: 14px;
  background: rgba(120, 120, 128, 0.16);
  color: var(--gp-text-2);
  padding: 0 10px;
  min-height: 26px;
}

.gp-sidebar {
  background: var(--gp-bg) !important;
}
.gp-sidebar__list {
  padding: 6px 0;
}
.gp-sidebar__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 8px 14px;
  margin: 2px 6px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--gp-text);
  font-size: 14.5px;
  transition: background var(--gp-dur) var(--gp-ease);
}
.gp-sidebar__row:hover {
  background: rgba(120, 120, 128, 0.1);
}
.gp-sidebar__row:active {
  background: rgba(120, 120, 128, 0.18);
}
.gp-sidebar__row--active {
  background: rgba(108, 79, 224, 0.14);
  color: var(--q-primary);
  font-weight: 600;
}
.gp-sidebar__icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex: 0 0 24px;
}
.gp-sidebar__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gp-sidebar__count {
  color: var(--gp-text-2);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.gp-sidebar__row--active .gp-sidebar__count {
  color: var(--q-primary);
}

.gp-inspector {
  background: var(--gp-bg) !important;
}
.gp-inspector__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 8px 18px;
  font-weight: 700;
  font-size: 14px;
  color: var(--gp-text-2);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 0.5px solid var(--gp-sep);
  background: var(--gp-row);
}

.gp-shell--tabbar {
  padding-bottom: 72px;
}

.gp-slide-enter-active,
.gp-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.gp-slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.gp-slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
