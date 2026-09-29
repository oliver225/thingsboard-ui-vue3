<script lang="ts" setup name="BasicTableTitle">
import type { PropType } from 'vue';

import type { Recordable } from '../types/shared';

import { computed } from 'vue';

import { isFunction } from '@vben/utils';

import { VbenHelpTooltip } from '@vben-core/shadcn-ui';

const props = defineProps({
  title: {
    default: undefined,
    type: [Function, String] as PropType<
      ((data: Recordable) => string) | string
    >,
  },
  getSelectRows: {
    default: undefined,
    type: Function as PropType<() => Recordable[]>,
  },
  helpMessage: {
    default: undefined,
    type: [String, Array] as PropType<string | string[]>,
  },
});

const getTitle = computed(() => {
  const { title, getSelectRows = () => {} } = props;
  let tit = title;

  if (isFunction(title)) {
    tit = title({
      selectRows: getSelectRows(),
    });
  }
  return tit;
});
</script>
<template>
  <span class="tb-basic-table-title" v-if="getTitle">
    {{ getTitle }}
    <VbenHelpTooltip v-if="helpMessage" trigger-class="ml-2 size-4">{{
      Array.isArray(helpMessage) ? helpMessage.join(' / ') : helpMessage
    }}</VbenHelpTooltip>
  </span>
</template>
<style lang="less">
.tb-basic-table-title {
  display: flex;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  color: hsl(var(--foreground));
  justify-content: space-between;
  align-items: center;
}
</style>
