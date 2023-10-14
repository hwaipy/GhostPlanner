<template>
  <q-list separator class="info-list" v-if="node.label > -1">
    <q-item class="info-list-item">
      <q-expansion-item expand-separator default-opened switch-toggle-side dense dense-toggle label="Title" header-class="info-head" class="info-list-expansion-item">
        <q-card>
          <q-input v-model="title" outlined autogrow debounce="5000" :dense="true" />
        </q-card>
      </q-expansion-item>
    </q-item>
    <q-item>
      <p>1122</p>
    </q-item>
  </q-list>
  <div class="text-h5 empty-selection" v-else>No Selection</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  node: any;
}>();

const title = computed({
  get() {
    return props.node.title;
  },
  set(newValue) {
    props.node.set_property('Title', newValue);
  },
});
</script>

<style>
.info-head {
  color: black;
  background-color: transparent;
  width: 240px;
}
.info-head:hover {
  color: black;
  background-color: transparent;
}
.info-list {
  padding-left: 15px;
  padding-right: 15px;
}
.info-list-item {
  padding-left: 0px;
  padding-right: 0px;
}
.info-list-expansion-item {
  right: 0px;
}
.empty-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: inherit;
  color: rgb(193, 193, 193);
}
</style>
