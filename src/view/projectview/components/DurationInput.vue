<template>
  <FormattedInput :node="node" :value="node.estimatedDuration" :setValue="(v: number) => setValue(v)" :rules="[(val: any) => parseEstimatedDuration(val) >= 0 || 'Invalid expression.']" :parser="parseEstimatedDuration" :formatter="formatEstimatedDuration"></FormattedInput>
</template>

<script setup lang="ts">
import FormattedInput from './FormattedInput.vue';
const props = defineProps<{
  node: any;
  value: any;
  setValue: (v: number) => any;
}>();

const re_number = new RegExp('^[0-9]+$');
const re_duration = new RegExp('^(([0-9]+)y(ear(s)?)?)?(([0-9]+)m(onth(s)?)?)?(([0-9]+)w(eek(s)?)?)?(([0-9]+)d(ay(s)?)?)?(([0-9]+)h(our(s)?)?)?(([0-9]+)m(in(ute(s)?)?)?)?(([0-9]+)s(econd(s)?)?)?$');
const parseEstimatedDuration = (val: string) => {
  if (val.length == 0) return 0;
  else if (re_number.exec(val)) return parseInt(val);
  else {
    const m_duration = re_duration.exec(val.replaceAll(' ', '').toLowerCase());
    if (m_duration) {
      let newValueInSecond = m_duration[2] ? parseInt(m_duration[2]) * 365 * 24 * 3600 : 0;
      newValueInSecond += m_duration[6] ? parseInt(m_duration[6]) * 30 * 24 * 3600 : 0;
      newValueInSecond += m_duration[10] ? parseInt(m_duration[10]) * 7 * 24 * 3600 : 0;
      newValueInSecond += m_duration[14] ? parseInt(m_duration[14]) * 24 * 3600 : 0;
      newValueInSecond += m_duration[18] ? parseInt(m_duration[18]) * 3600 : 0;
      newValueInSecond += m_duration[22] ? parseInt(m_duration[22]) * 60 : 0;
      newValueInSecond += m_duration[27] ? parseInt(m_duration[27]) * 1 : 0;
      if (newValueInSecond == 0) return NaN;
      return newValueInSecond;
    } else return NaN;
  }
};
const formatEstimatedDuration = (value: number) => {
  if (value < 1) return '';
  const day = parseInt(value / 86400);
  const rm1 = value % 86400;
  const hour = parseInt(rm1 / 3600);
  const rm2 = rm1 % 3600;
  const minute = parseInt(rm2 / 60);
  const second = parseInt(rm2 % 60);
  return (day ? day + 'd ' : '') + (hour ? hour + 'h ' : '') + (minute ? minute + 'min ' : '') + (second ? second + 's ' : '');
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
