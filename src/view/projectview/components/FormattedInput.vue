<template>
  <q-input v-model="inputModel" ref="inputRef" outlined dense hide-bottom-space :rules="rules" @blur="onInputBlur" class="info-list-item-formatted-input" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
const props = defineProps<{
  node: any;
  value: any;
  setValue: (v: number) => any;
  rules: [any];
  parser: (a: string) => number;
  formatter: (a: number) => string;
}>();
const inputModel = ref('');
const inputRef = ref(null);
const selectedValue = computed(() => {
  return props.value;
});

function onSelectionValueChange() {
  inputModel.value = props.value > 0 ? props.formatter(props.value) : '';
}
onSelectionValueChange();
watch(selectedValue, async (newV: any, oldV: any) => {
  onSelectionValueChange();
});

const onInputBlur = (evt) => {
  const newValue = props.parser(inputModel.value);
  if (!isNaN(newValue)) {
    props.setValue(newValue);
    onSelectionValueChange();
  }
};
</script>

<style>
.info-list-item-formatted-input {
  background-color: white;
}
.info-list-item-formatted-input .q-field__bottom {
  background-color: rgb(245, 245, 245);
}
</style>
