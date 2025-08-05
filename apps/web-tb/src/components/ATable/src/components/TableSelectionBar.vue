<script lang="ts" setup name="TableSelectBar">
import type { TableActionType } from '../types/table';

import { Alert as AAlert } from 'ant-design-vue';

import { useDesign } from '/@/hooks/web/useDesign';
import { useI18n } from '/@/hooks/web/useI18n';

const props = withDefaults(
  defineProps<{
    clearSelectedRowKeys: TableActionType['clearSelectedRowKeys'];
    count?: number;
  }>(),
  {
    count: () => 0,
  },
);
const { t } = useI18n();
const { prefixCls } = useDesign('table-select-bar');
</script>

<template>
  <AAlert type="info" show-icon :class="[prefixCls]">
    <template #message>
      <span v-if="props.count > 0">
        {{ t('component.table.selectionBarTips', { count: props.count }) }}
      </span>
      <span v-else>
        {{ t('component.table.selectionBarEmpty') }}
      </span>
      <a-button
        type="link"
        @click="clearSelectedRowKeys"
        size="small"
        v-show="props.count > 0"
      >
        {{ t('component.table.selectionBarClear') }}
      </a-button>
    </template>
  </AAlert>
</template>

<style lang="less">
@prefix-cls: ~'jeesite-table-select-bar';

.@{prefix-cls} {
  flex-grow: 1;
  padding: 2px 8px;

  :deep(.ant-btn-link) {
    height: 20px;
    line-height: 20px;
  }
}
</style>
