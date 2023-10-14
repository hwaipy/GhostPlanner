<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page>
        <q-splitter v-model="splitterModel" unit="px" style="min-height: inherit" disable before-class="main-splitter-before" after-class="main-splitter-after" separator-class="main-splitter-separator">
          <template v-slot:before>
            <q-tabs v-model="tab" vertical active-bg-color="listgrey" indicator-color="transparent">
              <q-tab name="inbox" icon="inbox" label="Inbox" class="inbox hh label" />
              <q-tab name="projects" icon="workspaces" label="Projects" class="projects label" />
              <q-tab name="tags" icon="local_offer" label="Tags" class="tags label" />
              <q-tab name="forecast" icon="dashboard" label="Forecast" class="forecast label" />
              <q-tab name="flagged" icon="flag" label="Flagged" class="flagged label" />
              <q-tab name="review" icon="coffee" label="Review" class="review label" />
            </q-tabs>
          </template>

          <template v-slot:after>
            <q-tab-panels v-model="tab" swipeable vertical>
              <q-tab-panel name="inbox">
                <div class="text-h4 q-mb-md">Inbox</div>
                <p>Not Impelmented.</p>
              </q-tab-panel>

              <q-tab-panel name="projects">
                <ProjectView :model="wn"></ProjectView>
              </q-tab-panel>

              <q-tab-panel name="tags">
                <div class="text-h4 q-mb-md">Tags</div>
                <p>Not Impelmented.</p>
              </q-tab-panel>

              <q-tab-panel name="forecast">
                <div class="text-h4 q-mb-md">Forecast</div>
                <p>Not Impelmented.</p>
              </q-tab-panel>

              <q-tab-panel name="flagged">
                <div class="text-h4 q-mb-md">Flagged</div>
                <p>Not Impelmented.</p>
              </q-tab-panel>

              <q-tab-panel name="review">
                <div class="text-h4 q-mb-md">Review</div>
                <p>Not Impelmented.</p>
              </q-tab-panel>
            </q-tab-panels>
          </template>
        </q-splitter>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import ProjectView from '../view/projectview/ProjectView.vue';
import wn from '../core/WhatsNext';

wn.init();
const tab = ref('projects');
const splitterModel = ref(60);
</script>

<style>
.main-splitter-before {
  min-height: inherit;
  background-color: #262626;
}
.main-splitter-after {
  min-height: inherit;
}
.main-splitter-separator {
  background-color: rgb(51, 51, 51);
}
.q-tab__label {
  color: white;
  font-size: 10px;
  text-transform: capitalize;
  font-weight: bold;
}
div.inbox i {
  color: rgb(127, 135, 175);
}
div.projects i {
  color: rgb(95, 171, 246);
}
div.tags i {
  color: rgb(183, 130, 248);
}
div.forecast i {
  color: rgb(217, 84, 105);
}
div.flagged i {
  color: rgb(229, 143, 95);
}
div.review i {
  color: rgb(124, 129, 225);
}
.label {
  min-height: 60px;
}
.q-tab-panel {
  padding: 0px;
  min-height: inherit;
}
.q-tab-panels {
  padding: 0px;
  min-height: inherit;
}
.q-panel {
  padding: 0px;
  min-height: inherit;
}
.bg-listgrey {
  background: rgb(51, 51, 51) !important;
}
</style>
