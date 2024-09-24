<template>
  <q-input outlined v-model="date" class="info-list-item-input info-list-item-input-date">
    <template v-slot:prepend>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date v-model="date" mask="YYYY-MM-DD HH:mm">
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Close" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
    <template v-slot:append>
      <q-icon name="access_time" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-time v-model="date" mask="YYYY-MM-DD HH:mm" format24h>
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Close" color="primary" flat />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import moment from 'moment';

const props = defineProps<{
  node: any;
  value: any;
  setValue: (v: number) => any;
}>();
const selectedValue = computed(() => {
  return props.value;
});
const dateModel = ref('');
const date = ref('2019-02-01 12:44TT');

function onSelectionValueChange() {
  date.value = props.value >= 0 ? moment(props.value).format('YYYY-MM-DD HH:mm') : '';
}
onSelectionValueChange();
watch(selectedValue, async (newV: any, oldV: any) => {
  onSelectionValueChange();
});
</script>

<style></style>
