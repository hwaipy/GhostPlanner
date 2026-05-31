<template>
  <q-page class="gp-page">
    <InspectorContent :node="node" @deleted="onDeleted" />
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import wn from '../core/WhatsNext';
import InspectorContent from '../components/InspectorContent.vue';

const route = useRoute();
const router = useRouter();
const node = computed(() => wn.get_task_node(String(route.params.uid)));

function onDeleted() {
  router.back();
}
</script>
