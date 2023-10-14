<template>
  <q-tree class="project-tree-list" :nodes="model.task_model.value.children" node-key="label" default-expand-all :filter="filter" :filter-method="filterMethod" v-model:selected="selectedProject" @update:selected="$emit('selectionChanged', selectedProject)" no-connectors>
    <template v-slot:default-header="prop">
      <div class="row items-center" style="min-height: inherit">
        <q-icon :name="prop.node.icon || (hasSubProject(prop.node) ? 'work' : 'workspaces')" size="18px" class="q-mr-sm" />
        <div class="project-list-text">{{ prop.node.title }}</div>
      </div>
    </template>
  </q-tree>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{
  model: any;
}>();

const selectedProject = ref(null);

const filter = 'isProject';

const filterMethod = (node: any) => {
  return node.isProject;
};

const hasSubProject = (node: any) => {
  return node.children.find((item: any) => {
    return item.isProject;
  });
};
</script>

<style>
.project-list-text {
  color: white;
  font-size: 14px;
}
.project-tree-list .q-tree__node--selected {
  background-color: rgb(70, 70, 70);
  color: white;
}
.project-tree-list .q-tree__node-header-content {
  color: white;
}
</style>
