<template>
  <nav class="gp-tabbar">
    <button
      v-for="p in tabs"
      :key="p.name"
      class="gp-tabbar__btn"
      :class="{ 'gp-tabbar__btn--active': isActive(p.to) }"
      @click="$router.push(p.to)"
    >
      <q-icon :name="p.icon" size="22px" />
      <span class="gp-tabbar__label">{{ p.label }}</span>
      <span v-if="p.count" class="gp-tabbar__badge">{{ p.count }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePerspectives } from '../core/perspectives';

const route = useRoute();
const perspectives = usePerspectives();
const tabs = computed(() => perspectives.value.filter((p) => p.mobileTab));

function isActive(to: string) {
  return route.path === to || (to !== '/' && route.path.startsWith(to));
}
</script>

<style>
.gp-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  background: var(--gp-row);
  border-top: 0.5px solid var(--gp-sep);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.gp-tabbar__btn {
  position: relative;
  flex: 1;
  border: 0;
  background: transparent;
  color: var(--gp-text-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 4px 8px;
  font-size: 10.5px;
  gap: 2px;
  cursor: pointer;
}
.gp-tabbar__btn--active {
  color: var(--q-primary);
}
.gp-tabbar__label {
  letter-spacing: 0.2px;
}
.gp-tabbar__badge {
  position: absolute;
  top: 4px;
  right: calc(50% - 18px);
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: #ff3b30;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>
