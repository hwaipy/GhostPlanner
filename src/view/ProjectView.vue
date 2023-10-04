<template>
  <div>
    <q-splitter v-model="splitterModel" unit="px" style="height: 1200px">
      <template v-slot:before>
        <div class="q-pa-md q-gutter-sm">
          <q-tree :nodes="taskModel" node-key="label" default-expand-all :filter="filter" :filter-method="filterMethod" v-model:selected="selected">
            <template v-slot:default-header="prop">
              <div class="row items-center">
                <q-icon :name="prop.node.icon || (hasSubProject(prop.node) ? 'work' : 'workspaces')" color="blue" size="18px" class="q-mr-sm" />
                <div class="text-weight-bold text-primary">{{ prop.node.title }}</div>
              </div>
            </template>
          </q-tree>
        </div>
      </template>
      <template v-slot:after>
        <div class="q-pa-md q-gutter-sm">
          <q-tree :nodes="taskView(selected)" node-key="label" default-expand-all>
            <template v-slot:default-header="prop">
              <div class="row items-center">
                <q-icon :name="'workspaces'" color="blue" size="18px" class="q-mr-sm" />
                <div class="text-weight-bold text-primary">{{ prop.node.title }}</div>
              </div>
            </template>
          </q-tree>
        </div>
      </template>
    </q-splitter>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const props = defineProps(['model']);
const splitterModel = ref(300);
const wn = props['model'];
const taskModel = wn.task_model.value.children;
const filter = 'isProject';
const selected = ref(null);

const filterMethod = (node) => {
  return node.isProject;
};

const hasSubProject = (node) => {
  return node.children.find((item) => {
    return item.isProject;
  });
};

const taskView = (selectedID) => {
  if (selectedID == null) return wn.task_model.value.children;
  return [wn.get_task_node(selectedID)];
};
</script>
