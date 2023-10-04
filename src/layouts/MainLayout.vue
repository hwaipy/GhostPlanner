<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <div>
        <q-splitter v-model="splitterModel" unit="px" :limits="[splitterModel, splitterModel]" animated="false" style="height: 1200px">
          <template v-slot:before>
            <q-tabs v-model="tab" vertical class="text-teal">
              <q-tab name="inbox" icon="inbox" label="Inbox" />
              <q-tab name="projects" icon="workspaces" label="Projects" />
              <q-tab name="forecast" icon="local_offer" label="Forecast" />
              <q-tab name="flagged" icon="flag" label="Flagged" />
              <q-tab name="review" icon="coffee" label="Review" />
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
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import ProjectView from '../view/ProjectView.vue';
import wn from '../core/WhatsNext';

wn.init();
const tab = ref('projects');
const splitterModel = ref(90);
</script>
