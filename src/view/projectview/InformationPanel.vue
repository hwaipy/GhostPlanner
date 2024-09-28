<template>
  <q-list separator class="info-list" v-if="node.label > -1">
    <InformationPanelCard label="Title">
      <q-input v-model="title" outlined autogrow debounce="5000" dense class="info-list-item-input" oninput="this.value = this.value.replaceAll('\n', '')" @keyup.enter="onInputChangeComplete" />
    </InformationPanelCard>
    <InformationPanelCard label="Action">
      <div class="info-list-item-label">Status: {{ status }}</div>
      <div class="row">
        <q-btn-toggle
          class="info-panel-task-status-toggle"
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
          no-caps
        />
        <div class="col-2"></div>
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
      <DurationInput :node="node" :value="node.estimatedDuration" :setValue="(v: number) => node.set_property('estimatedDuration', v)"></DurationInput>
      <p></p>
      <div class="info-list-item-label">Defer Until:</div>
      <DateInputPanel :node="node" :value="node.deferUntil" :setValue="(v: number) => node.set_property('deferUntil', v)"></DateInputPanel>
      <p></p>
      <div class="info-list-item-label">Due:</div>
      <DateInputPanel :node="node" :value="node.due" :setValue="(v: number) => node.set_property('due', v)"></DateInputPanel>
    </InformationPanelCard>
  </q-list>
  <div class="text-h5 empty-selection" v-else>No Selection</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import InformationPanelCard from './InformationPanelCard.vue';
import DateInputPanel from './components/DateInputPanel.vue';
import DurationInput from './components/DurationInput.vue';

const props = defineProps<{
  node: any;
  validTags: [any];
}>();

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

const onInputChangeComplete = (evt) => {
  evt.target.blur();
  evt.target.select();
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
.info-list-item-input-formatted .q-field__bottom {
  background-color: rgb(245, 245, 245);
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
.info-panel-task-status-toggle {
  border: 1px solid #027be3;
}
</style>
