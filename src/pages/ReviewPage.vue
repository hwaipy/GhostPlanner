<template>
  <q-page class="gp-page">
    <TaskList :nodes="nodes" show-empty empty-text="No projects to review" />
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import wn from '../core/WhatsNext';
import { INBOX_ID } from '../core/types';
import { isDone } from '../core/format';
import { ui } from '../core/ui';
import TaskList from '../components/TaskList.vue';

// All projects (any depth), for periodic review.
const nodes = computed(() =>
  wn.all_nodes().filter((n: any) => n.isProject && n.label !== INBOX_ID && (ui.showCompleted || !isDone(n)))
);
</script>
