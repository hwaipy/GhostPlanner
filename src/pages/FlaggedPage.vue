<template>
  <q-page class="gp-page">
    <TaskList :nodes="nodes" show-project show-empty empty-text="Nothing flagged" />
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import wn from '../core/WhatsNext';
import { isAvailable } from '../core/format';
import { ui } from '../core/ui';
import TaskList from '../components/TaskList.vue';

const nodes = computed(() =>
  wn.all_nodes().filter((n: any) => n.flagged && !n.isProject && (ui.showCompleted || isAvailable(n)))
);
</script>
