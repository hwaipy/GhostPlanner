<template>
  <q-tree :nodes="taskModel" node-key="label" default-expand-all :filter="filter" :filter-method="filterMethod" v-model:selected="selected" no-connectors>
    <template v-slot:default-header="prop">
      <div class="row items-center" style="min-height: inherit">
        <q-icon :name="prop.node.icon || (hasSubProject(prop.node) ? 'work' : 'workspaces')" size="18px" class="q-mr-sm" />
        <div class="project-list-text">{{ prop.node.title }}</div>
      </div>
    </template>
  </q-tree>
</template>

<script setup>
const filterMethod = (node) => {
  return node.isProject;
};

const hasSubProject = (node) => {
  return node.children.find((item) => {
    return item.isProject;
  });
};
</script>
