<template>
  <q-list separator class="info-list" v-if="node.label > -1">
    <InformationPanelCard label="Title">
      <q-input v-model="title" outlined autogrow debounce="5000" dense class="info-list-item-input" />
    </InformationPanelCard>
    <InformationPanelCard label="Action">
      <div class="info-list-item-label">Status: {{ status }}</div>
      <div class="row">
        <q-btn-toggle
          class="col-10"
          v-model="status"
          toggle-color="blue-2"
          :options="[
            { value: 'Active', icon: 'play_arrow' },
            { value: 'Completed', icon: 'done' },
            { value: 'Dropped', icon: 'hide_source' },
          ]"
          rounded
          unelevated
          size="sm"
        />
        <q-btn class="col-1" :color="flagged ? 'amber-4' : 'white'" icon="tour" unelevated size="sm" @click="() => (flagged = !flagged)" />
      </div>
      <p></p>
      <div class="row">
        <div class="info-list-item-label" style="width: 210px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; padding-right: 10px">Project: {{ node.get_project_node().title }}</div>
        <q-btn class="col-1" color="white" icon="next_plan" dense unelevated size="xs" @click="$emit('gotoProject', node.get_project_node().label)" />
      </div>
    </InformationPanelCard>
    <InformationPanelCard label="Tags">
      <q-select class="info-panel-tags" popup-content-class="info-panel-tags-popup" filled v-model="tags" multiple :options="tagOptions" use-chips use-input input-debounce="0" @filter="filterTags" @new-value="newTag" />
    </InformationPanelCard>
    <InformationPanelCard label="Dates">
      <div class="info-list-item-label">Estimated Duration:</div>
      <q-input v-model="estimatedDurationModel" ref="inputRef" outlined dense hide-bottom-space @blur="estimatedDurationInputBlur" :rules="[(val) => parseEstimatedDuration(val) >= 0 || 'Invalid expression.']" class="info-list-item-input info-list-item-input-duration" />
      <FormattedInput :model="node.estimatedDuration" :rules="[(val) => parseEstimatedDuration(val) >= 0 || 'Invalid expression.']"></FormattedInput>
      <p></p>
      <div class="info-list-item-label">Defer Until:</div>
      <!-- <DateInputPanel :node="node"></DateInputPanel> -->
    </InformationPanelCard>
  </q-list>
  <div class="text-h5 empty-selection" v-else>No Selection</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import InformationPanelCard from './InformationPanelCard.vue';
import DateInputPanel from './DateInputPanel.vue';
import FormattedInput from './components/FormattedInput.vue';

const props = defineProps<{
  node: any;
  validTags: [any];
}>();
const selectedNode = computed(() => {
  return props.node;
});

const title = computed({
  get() {
    return props.node.title;
  },
  set(newValue) {
    props.node.set_property('title', newValue);
  },
});

const status = computed({
  get() {
    return props.node.status;
  },
  set(newValue) {
    props.node.set_property('status', newValue);
  },
});

const flagged = computed({
  get() {
    return props.node.flagged;
  },
  set(newValue) {
    props.node.set_property('flagged', newValue);
  },
});

const tags = computed({
  get() {
    return props.node.tags;
  },
  set(newValue) {
    props.node.set_property('tags', newValue);
  },
});
const tagOptions = ref(props.validTags);
const filterTags = (val: any, update: any) => {
  update(() => {
    if (val === '') {
      tagOptions.value = props.validTags;
    } else {
      const needle = val.toLowerCase();
      tagOptions.value = tagOptions.value.filter((v) => v.toLowerCase().indexOf(needle) > -1);
    }
  });
};
const newTag = (val: any, done: any) => {
  if (val.length > 0) {
    const modelValue = (tags.value || []).slice();
    val
      .split(/[,;|]+/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .forEach((v) => {
        if (tagOptions.value.includes(v) === false) {
          tagOptions.value.push(v);
        }
        if (modelValue.includes(v) === false) {
          modelValue.push(v);
        }
      });

    done(null);
    tags.value = modelValue;
  }
};

const estimatedDurationModel = ref('');
const re_number = new RegExp('^[0-9]+$');
const re_duration = new RegExp('^(([0-9]+)y(ear(s)?)?)?(([0-9]+)m(onth(s)?)?)?(([0-9]+)w(eek(s)?)?)?(([0-9]+)d(ay(s)?)?)?(([0-9]+)h(our(s)?)?)?(([0-9]+)m(inute(s)?)?)?(([0-9]+)s(econd(s)?)?)?$');
const inputRef = ref(null);
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
      newValueInSecond += m_duration[26] ? parseInt(m_duration[26]) * 1 : 0;
      if (newValueInSecond == 0) return -1;
      return newValueInSecond;
    }
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
  return (day ? day + 'd ' : '') + (hour ? hour + 'h ' : '') + (minute ? minute + 'm ' : '') + (second ? second + 's ' : '');
};
watch(selectedNode, async (newV: any, oldV: any) => {
  estimatedDurationModel.value = selectedNode.value.estimatedDuration > 0 ? formatEstimatedDuration(selectedNode.value.estimatedDuration) : '';
});
const estimatedDurationInputBlur = (evt) => {
  const newValue = parseEstimatedDuration(estimatedDurationModel.value);
  if (newValue >= 0) props.node.set_property('estimatedDuration', newValue);
};
</script>

<style>
.info-list {
  padding-left: 15px;
  padding-right: 15px;
}
.empty-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: inherit;
  color: rgb(193, 193, 193);
}
.info-list-item-label {
  margin-bottom: 0px;
  background-color: transparent;
}
.info-list-item-input {
  background-color: white;
}
.info-panel-tags {
  background-color: white;
}
.info-panel-tags .q-chip__content {
  max-width: 140px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.info-panel-tags-popup {
  width: 10px;
}
.info-panel-tags-popup .q-item__section {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
