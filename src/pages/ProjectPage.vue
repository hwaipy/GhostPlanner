<template>
  <q-page class="gp-page">
    <TaskList :nodes="nodes" show-empty empty-text="No items" />
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import wn from '../core/WhatsNext';
import { visibleChildren } from '../core/format';
import { ui } from '../core/ui';
import TaskList from '../components/TaskList.vue';

const route = useRoute();
const nodes = computed(() => {
  const node = wn.get_task_node(String(route.params.uid));
  return node ? visibleChildren(node, ui.showCompleted) : [];
});
</script>
