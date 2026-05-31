<template>
  <q-page class="gp-page">
    <TaskList :nodes="nodes" show-empty empty-text="Inbox is empty" />
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import wn from '../core/WhatsNext';
import { INBOX_ID } from '../core/types';
import { visibleChildren } from '../core/format';
import { ui } from '../core/ui';
import TaskList from '../components/TaskList.vue';

const nodes = computed(() => {
  const inbox = wn.get_task_node(INBOX_ID);
  return inbox ? visibleChildren(inbox, ui.showCompleted) : [];
});
</script>
