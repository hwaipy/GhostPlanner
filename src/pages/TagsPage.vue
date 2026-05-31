<template>
  <q-page class="gp-page">
    <div v-if="tags.length" class="gp-list q-mt-md">
      <div v-for="t in tags" :key="t.name" class="gp-tile" @click="$router.push({ name: 'tag', params: { name: t.name } })">
        <div class="gp-tile__icon" style="background: #30b0c7"><q-icon name="local_offer" size="16px" /></div>
        <div class="gp-item__main"><div class="gp-item__title">{{ t.name }}</div></div>
        <span class="gp-tile__count">{{ t.count || '' }}</span>
        <q-icon name="chevron_right" color="grey-5" size="22px" />
      </div>
    </div>
    <div v-else class="gp-empty">No tags yet</div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import wn from '../core/WhatsNext';
import { isAvailable } from '../core/format';

const tags = computed(() => {
  const all = wn.all_nodes();
  return wn.tags
    .map((name: string) => ({
      name,
      count: all.filter((n: any) => !n.isProject && isAvailable(n) && n.tags.includes(name)).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});
</script>
