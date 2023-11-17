<template>
  <!-- <q-input   @blur="estimatedDurationInputBlur"(add Enter!) /> -->
  <q-input v-model="inputModel" ref="inputRef" outlined dense hide-bottom-space :rules="rules" class="info-list-item-formatted-input" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
const props = defineProps<{
  // node: any;
  model: any;
  rules: [any];
}>();
// const selectedNode = computed(() => {
//   return props.node;
// });
// const dateModel = ref('');
watch(props.model, async (newV: any, oldV: any) => {
  console.log('model ' + props.model);
});
const inputModel = ref('');
const inputRef = ref(null);

const date = ref('2019-02-01 12:44');
</script>

<style>
.info-list-item-formatted-input {
  background-color: white;
}
.info-list-item-formatted-input .q-field__bottom {
  background-color: rgb(245, 245, 245);
}
</style>
