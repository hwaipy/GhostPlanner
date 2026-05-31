<template>
  <q-page class="gp-page">
    <TaskList :nodes="nodes" show-project show-empty :empty-text="'No actions tagged #' + name" />
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import wn from '../core/WhatsNext';
import { isAvailable } from '../core/format';
import { ui } from '../core/ui';
import TaskList from '../components/TaskList.vue';

const route = useRoute();
const name = computed(() => String(route.params.name));
const nodes = computed(() =>
  wn.all_nodes().filter((n: any) => !n.isProject && n.tags.includes(name.value) && (ui.showCompleted || isAvailable(n)))
);
</script>
