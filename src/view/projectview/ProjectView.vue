<template>
  <q-splitter v-model="splitterModel" unit="px" :limits="[200, Infinity]" before-class="project-splitter-before" after-class="project-splitter-after" separator-class="project-splitter-separator">
    <template v-slot:before>
      <ProjectTreeList :model="wn" @selectionChanged="(s) => (selectedProject = s)"></ProjectTreeList>
    </template>
    <template v-slot:after>
      <q-layout view="lHh lpr lFf" container style="min-height: inherit">
        <q-header>
          <q-toolbar class="right-panel-head">
            <div class="right-panel-title">Projects</div>
            <q-space />
            <q-btn flat round dense icon="info_outline" @click="(evt, go) => (splitterInfoModel = 270 - splitterInfoModel)" />
          </q-toolbar>
        </q-header>
        <q-page-container>
          <q-page>
            <q-splitter v-model="splitterInfoModel" unit="px" :limits="[0, 270]" disable reverse before-class="info-splitter-before" after-class="info-splitter-after" separator-class="info-splitter-separator">
              <template v-slot:before>
                <TaskTreeList :model="taskView(selectedProject)" @selectionChanged="(s) => (selectedTask = s)"></TaskTreeList>
              </template>
              <template v-slot:after>
                <InformationPanel :node="wn.get_task_node(selectedTask)"></InformationPanel>
              </template>
            </q-splitter>
          </q-page>
        </q-page-container>
      </q-layout>
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProjectTreeList from './ProjectTreeList.vue';
import TaskTreeList from './TaskTreeList.vue';
import InformationPanel from './InformationPanel.vue';

const props = defineProps<{
  model: any;
}>();
const wn = props.model;

const splitterModel = ref(230);
const splitterInfoModel = ref(270);
const selectedProject = ref(null);
const selectedTask = ref(null);

const taskView = (selectedID: any) => {
  if (selectedID == null) return wn.task_model.value.children;
  return [wn.get_task_node(selectedID)];
};
</script>

<style>
.project-splitter-before {
  min-height: inherit;
  background-color: rgb(51, 51, 51);
  color: red;
  padding-left: 5px;
  padding-right: 5px;
}
.project-splitter-after {
  min-height: inherit;
}
.project-splitter-separator {
  background-color: rgb(51, 51, 51);
}
.info-splitter-before {
  min-height: inherit;
}
.info-splitter-after {
  min-height: inherit;
  background-color: rgb(245, 245, 245);
}
.info-splitter-separator {
  background-color: transparent;
}
.q-splitter {
  min-height: inherit;
}
div i {
  color: rgb(95, 171, 246);
}
.right-panel-head {
  background-color: white;
  border-color: rgb(235, 235, 235);
  border-top-style: none;
  border-right-style: none;
  border-left-style: none;
  border-bottom-style: solid;
}
.right-panel-title {
  color: rgb(95, 171, 246);
  font-size: 26px;
  font-weight: 900;
}
</style>
