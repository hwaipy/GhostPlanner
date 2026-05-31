<template>
  <div>
    <div v-if="title" class="gp-section-title">{{ title }}</div>
    <div v-if="nodes.length" class="gp-list">
      <TaskRow v-for="n in nodes" :key="n.label" :node="n" :show-project="showProject" />
    </div>
    <div v-else-if="showEmpty" class="gp-empty">{{ emptyText || 'Nothing here' }}</div>
  </div>
</template>

<script setup lang="ts">
import TaskRow from './TaskRow.vue';

defineProps<{
  nodes: any[];
  title?: string;
  showProject?: boolean;
  emptyText?: string;
  showEmpty?: boolean;
}>();
</script>
