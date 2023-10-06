<template>
  <q-splitter v-model="splitterModel" unit="px" :limits="[200, Infinity]" before-class="project-splitter-before" after-class="project-splitter-after" separator-class="project-splitter-separator">
    <template v-slot:before>
      <ProjectTreeList></ProjectTreeList>
    </template>
    <template v-slot:after>
      <q-layout view="lHh lpr lFf" container style="min-height: inherit">
        <q-header>
          <q-toolbar class="right-panel-head">
            <div class="right-panel-title">Projects</div>
            <q-space />
            <q-btn flat round dense icon="info_outline" @click="(evt, go) => (splitterInfoModel = 200 - splitterInfoModel)" />
          </q-toolbar>
        </q-header>
        <q-page-container>
          <q-page>
            <q-splitter v-model="splitterInfoModel" unit="px" :limits="[0, 200]" disable reverse before-class="info-splitter-before" after-class="info-splitter-after" separator-class="info-splitter-separator">
              <template v-slot:before>
                <div>1</div>
              </template>
              <template v-slot:after>
                <q-list separator>
                  <q-item class="info-list-item">
                    <q-expansion-item expand-separator default-opened switch-toggle-side dense dense-toggle label="Title" header-class="info-head">
                      <q-card>
                        <q-card-section> Lorem ipsum dolor sit a am aliquid. </q-card-section>
                      </q-card>
                    </q-expansion-item>
                  </q-item>
                  <q-item>
                    <p>1122</p>
                  </q-item>
                  <q-item>
                    <p>1122</p>
                  </q-item>
                  <q-item>
                    <p>1122</p>
                  </q-item>
                </q-list>
              </template>
            </q-splitter>

            <!-- <div class="q-pa-md q-gutter-sm">
              <q-tree :nodes="taskView(selected)" node-key="label" default-expand-all no-connectors>
                <template v-slot:default-header="prop">
                  <div class="row items-center">
                    <q-icon :name="'workspaces'" color="blue" size="18px" class="q-mr-sm" />
                    <div class="text-weight-bold text-primary">{{ prop.node.title }}</div>
                  </div>
                </template>
              </q-tree>
            </div> -->
          </q-page>
        </q-page-container>
      </q-layout>
    </template>
  </q-splitter>
</template>

<script setup>
import { ref } from 'vue';
import ProjectTreeList from './projectview/ProjectTreeList.vue';

const props = defineProps(['model']);
const splitterModel = ref(230);
const wn = props['model'];
const taskModel = wn.task_model.value.children;
const filter = 'isProject';
const selected = ref(null);
const splitterInfoModel = ref(200);

const taskView = (selectedID) => {
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
  /*
  background-color: rgb(51, 51, 51);
  color: red;
  padding-left: 5px;
  padding-right: 5px; */
}
.info-splitter-after {
  min-height: inherit;
  background-color: rgb(245, 245, 245);
  /* border-color: rgb(223, 223, 223);
  border-top-style: none;
  border-right-style: none;
  border-left-style: solid;
  border-bottom-style: none; */
  padding-left: 15px;
  padding-right: 15px;
}
.info-splitter-separator {
  background-color: transparent;
}
.q-splitter {
  min-height: inherit;
}
.q-tree__node--selected {
  background-color: rgb(70, 70, 70);
  color: white;
}
.q-tree__node-header-content {
  color: white;
}
div i {
  color: rgb(95, 171, 246);
}
.project-list-text {
  color: white;
  font-size: 14px;
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
.project-task-item {
  background-color: white;
  border-color: rgb(235, 235, 235);
  border-top-style: none;
  border-right-style: none;
  border-left-style: none;
  border-bottom-style: solid;
}
.info-head {
  color: black;
  background-color: transparent;
}
.info-head:hover {
  color: black;
  background-color: transparent;
}
.info-list-item {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
