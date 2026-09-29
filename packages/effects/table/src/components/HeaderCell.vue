<script lang="ts" setup name="TableHeaderCell">
import type { PropType } from 'vue';

import type { BasicColumn } from '../types/table';

import { computed } from 'vue';

import { VbenHelpTooltip } from '@vben-core/shadcn-ui';

import EditTableHeaderCell from './EditTableHeaderIcon.vue';

const props = defineProps({
  column: {
    type: Object as PropType<BasicColumn>,
    default: () => ({}),
  },
});

const getIsEdit = computed(() => !!props.column?.edit);
const getIsEditRule = computed(() => props.column?.editRule === true);
const getHelpMessage = computed(() => props.column?.helpMessage);

const getTitles = computed(() => {
  const title = props.column?.title;
  return title && typeof title === 'object' && 'length' in title
    ? title
    : [title];
});

function isComponent(title: any) {
  return (
    typeof title === 'function' ||
    (title && typeof title === 'object' && 'type' in title)
  );
}
</script>
<template>
  <span v-if="getIsEditRule" class="c-red vertical-middle pr-1">*</span>
  <EditTableHeaderCell v-if="getIsEdit">
    <template v-for="title in getTitles" :key="title">
      <component :is="title" v-if="isComponent(title)" />
      <template v-else>{{ title }}</template>
    </template>
  </EditTableHeaderCell>
  <template v-else v-for="title in getTitles" :key="title">
    <component :is="title" v-if="isComponent(title)" />
    <template v-else>{{ title }}</template>
  </template>
  <VbenHelpTooltip v-if="getHelpMessage" trigger-class="ml-2 size-4">
    <div
      v-for="message in Array.isArray(getHelpMessage)
        ? getHelpMessage
        : [getHelpMessage]"
      :key="message"
    >
      {{ message }}
    </div>
  </VbenHelpTooltip>
</template>
<style lang="less">
.tb-basic-table-header-cell {
  &__help {
    margin-left: 8px;
    color: rgb(0 0 0 / 65%) !important;
  }
}
</style>
