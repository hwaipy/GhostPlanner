<template>
  <q-tree class="task-tree-list" :nodes="model" node-key="label" default-expand-all v-model:selected="selectedTask" @update:selected="$emit('selectionChanged', selectedTask)" no-connectors>
    <template v-slot:default-header="prop">
      <div class="row items-center" style="min-height: inherit" v-if="prop.node.isProject">
        <q-icon :name="hasSubProject(prop.node) ? 'work' : 'workspaces'" size="18px" class="q-mr-sm" />
        <div class="task-list-text">{{ prop.node.title }}</div>
      </div>
      <div class="row items-center" style="min-height: inherit" v-else>
        <q-icon :name="'radio_button_unchecked'" size="18px" class="q-mr-sm" />
        <div class="task-list-text">{{ prop.node.title }}</div>
      </div>
    </template>
  </q-tree>
</template>

<script setup lang="ts">
// task_alt  check_circle_outline
import { ref } from 'vue';
const props = defineProps<{
  model: any;
}>();

const selectedTask = ref(null);

const hasSubProject = (node: any) => {
  return node.children.find((item: any) => {
    return item.isProject;
  });
};
</script>

<style>
.task-list-text {
  color: black;
  font-size: 14px;
}
.task-tree-list .q-tree__node--selected {
  background-color: rgb(231, 240, 254);
  color: white;
}
.task-tree-list .q-tree__node-header-content {
  color: white;
}
</style>
