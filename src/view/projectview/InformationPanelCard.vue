<template>
  <q-item class="info-list-item">
    <q-expansion-item expand-separator default-opened switch-toggle-side dense dense-toggle :label="label" header-class="info-head" class="info-list-expansion-item">
      <q-card class="info-list-card">
        <slot></slot>
      </q-card>
    </q-expansion-item>
  </q-item>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
}>();
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
.info-list-item {
  padding-left: 0px;
  padding-right: 0px;
}
.info-list-expansion-item {
  right: 0px;
}
.info-list-card {
  background-color: transparent;
}
</style>
