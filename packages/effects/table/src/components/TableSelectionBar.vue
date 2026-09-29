<script lang="ts" setup name="TableSelectBar">
import type {
  TableActionType,
  TableBatchAction,
  TableSelection,
} from '../types/table';

import { toValue } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { i18n } from '@vben/locales';

import { Alert as AAlert, Button as AButton } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    count?: number;
    inline?: boolean;
    actions?: TableBatchAction[];
    locked?: boolean;
    selectedText?: (count: number) => string;
    selection?: TableSelection;
    clearSelectedRowKeys: TableActionType['clearSelectedRowKeys'];
  }>(),
  {
    count: () => 0,
    actions: () => [],
    selectedText: undefined,
    selection: undefined,
  },
);

const { t } = i18n.global;
</script>

<template>
  <div
    v-if="inline"
    class="table-selection-toolbar flex flex-wrap items-center gap-2"
  >
    <span
      class="text-muted-foreground mr-2 inline-flex items-center text-sm whitespace-nowrap"
      aria-live="polite"
    >
      {{
        selectedText?.(props.count) ??
        t('table.selectionBarTips', { count: props.count })
      }}
      <AButton
        type="link"
        size="small"
        class="h-auto p-0 text-sm"
        :disabled="locked"
        @click="clearSelectedRowKeys"
      >
        {{ t('table.selectionBarClear') }}
      </AButton>
    </span>
    <AButton
      v-for="action in actions"
      :key="action.key"
      :type="action.danger ? 'primary' : 'default'"
      :danger="action.danger"
      :disabled="locked || toValue(action.disabled)"
      @click="selection && action.onClick(selection)"
    >
      <template v-if="action.icon" #icon>
        <IconifyIcon :icon="action.icon" />
      </template>
      {{ toValue(action.label) }}
    </AButton>
  </div>
  <AAlert v-else type="info" show-icon class="tb-table-select-bar">
    <template #message>
      <span v-if="props.count > 0">
        {{ t('table.selectionBarTips', { count: props.count }) }}
      </span>
      <span v-else>
        {{ t('table.selectionBarEmpty') }}
      </span>
      <AButton
        type="link"
        @click="clearSelectedRowKeys"
        size="small"
        v-show="props.count > 0"
      >
        {{ t('table.selectionBarClear') }}
      </AButton>
    </template>
  </AAlert>
</template>

<style lang="less">
.tb-table-select-bar {
  flex-grow: 1;
  padding: 2px 10px;
  margin: 0 4px;

  .ant-btn-link {
    height: 20px;
    line-height: 20px;
  }
}
</style>
