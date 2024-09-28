<template>
  <q-input outlined v-model="dateModel" class="info-list-item-input info-list-item-input-date" @blur="onInputBlur" :rules="[(val: any) => parseDateString(val) >= -1 || 'Invalid expression.']">
    <template v-slot:prepend>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date v-model="dateModel" mask="YYYY-MM-DD HH:mm">
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
          <q-time v-model="dateModel" mask="YYYY-MM-DD HH:mm" format24h>
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

function onSelectionValueChange() {
  dateModel.value = props.value >= 0 ? moment(props.value).format('YYYY-MM-DD HH:mm') : '';
}
onSelectionValueChange();
watch(selectedValue, async () => {
  onSelectionValueChange();
});

const onInputBlur = () => {
  const newValue = parseDateString(dateModel.value);
  if (!isNaN(newValue)) {
    props.setValue(newValue);
    onSelectionValueChange();
  }
};

const eYear = ['Y'];
const eMonth = ['M', 'MM']; //, 'MMM', 'MMMM'
const eDay = ['D', 'DD', 'Do'];
const eDateSplit = ['-']; //['.', '-', '/'];
const eHour = ['H', 'HH'];
const eMinute = ['m', 'mm'];
const eTimeSplit = [':'];
const possibleDateFormats = [[eDay], [eMonth, eDateSplit, eDay], [eYear, eDateSplit, eMonth, eDateSplit, eDay]];
const possibleTimeFormats = [[eHour], [eHour, eTimeSplit, eMinute]];

function generateFormattedString(format: string[][][]): string[] {
  let result: string[][] = [];
  format.forEach((value: string[][]) => {
    result = result.concat(getCombinations(value));
  });
  return result.map((value: string[]) => {
    return value.join('');
  });
}

function getCombinations(arr: string[][], index = 0, current: string[] = [], result: string[][] = []): string[][] {
  if (index === arr.length) {
    result.push(current);
    return result;
  }
  for (let i = 0; i < arr[index].length; i++) {
    getCombinations(arr, index + 1, [...current, arr[index][i]], result);
  }
  return result;
}

const eDateBase = generateFormattedString(possibleDateFormats);
const eDate = new Set(
  eDateBase.concat(
    ...['.', '/'].map((e: string) => {
      return eDateBase.map((value: string) => {
        return value.replaceAll('-', e);
      });
    })
  )
);
const eTime = generateFormattedString(possibleTimeFormats);
const eDateTime: string[] = [];
eDate.forEach((date: string) => {
  eDateTime.push(date);
  eTime.forEach((time: string) => {
    eDateTime.push(date + ' ' + time);
  });
});
eTime.forEach((time: string) => eDateTime.push(time));

const parseDateString = (val: string) => {
  val = val.trim().replaceAll(/ +/g, ' ');
  if (val.length == 0) return -1;
  for (var i in eDateTime) {
    const m = moment(val, eDateTime[i], true);
    if (m.isValid()) return m.valueOf();
  }
  return NaN;
};
</script>

<style>
.info-list-item-input-date {
  background-color: white;
}
.info-list-item-input-date .q-field__bottom {
  background-color: rgb(245, 245, 245);
}
</style>
