<script lang="ts" setup name="TableAction">
import type { PropType } from 'vue';

import type { ActionItem, TableActionType } from '../index';

import { computed, toRaw } from 'vue';

import { $t } from '@vben/locales';
import { isBoolean, isFunction } from '@vben/utils';

import { getTableColumnFlags } from '../const';
import { useTableContext } from '../hooks/useTableContext';
import { usePermission } from '../hooks/useTablePermission';
import PopConfirmButton from './TableActionButton.vue';
import Popover from './TableActionMenu.vue';

const props = defineProps({
  actions: {
    type: Array as PropType<ActionItem[]>,
    default: null,
  },
  dropDownActions: {
    type: Array as PropType<ActionItem[]>,
    default: null,
  },
  divider: { type: Boolean, default: true },
  outside: { type: Boolean, default: false },
  stopButtonPropagation: { type: Boolean, default: false },
  align: { type: String, default: undefined },
});

let table: Partial<ReturnType<typeof useTableContext>> = {};
if (!props.outside) {
  table = useTableContext();
}

const { hasPermission } = usePermission();
function isIfShow(action: ActionItem): boolean {
  const ifShow = action.ifShow;

  let isIfShow = true;

  if (isBoolean(ifShow)) {
    isIfShow = ifShow;
  }
  if (isFunction(ifShow)) {
    isIfShow = ifShow(action);
  }
  return isIfShow;
}

const getActions = computed(() =>
  (toRaw(props.actions) || []).filter(
    (action) => hasPermission(action.auth) && isIfShow(action),
  ),
);

const getDropdownList = computed((): any[] => {
  const list = (toRaw(props.dropDownActions) || []).filter((action) => {
    return hasPermission(action.auth) && isIfShow(action);
  });
  return list.map((action, index) => {
    return {
      ...action,
      text: action.label,
      divider: index < list.length - 1 ? action.divider : false,
    };
  });
});

const getAlign = computed(() => {
  if (props.align) return props.align;
  const columns = (table as TableActionType)?.getColumns?.() || [];
  const actionColumn = columns.find(
    (item) =>
      item.flag === getTableColumnFlags(table.getProps?.value ?? {}).action,
  );
  return actionColumn?.align ?? 'center';
});

function onCellClick(e: MouseEvent) {
  if (!props.stopButtonPropagation) return;
  const path = e.composedPath() as HTMLElement[];
  const isInButton = path.find((ele) => {
    return ele.tagName?.toUpperCase() === 'BUTTON';
  });
  isInButton && e.stopPropagation();
}
</script>
<template>
  <div class="tb-basic-table-action" :class="[getAlign]" @click="onCellClick">
    <template
      v-for="(action, index) in getActions"
      :key="`${index}-${action.label}`"
    >
      <PopConfirmButton :action="action" />
    </template>
    <Popover
      v-if="props.dropDownActions && getDropdownList.length > 0"
      :trigger="['hover']"
      :drop-menu-list="getDropdownList"
      :classes="{ container: 'tb-basic-table-action__popover-content' }"
      :key="1"
      popconfirm
    >
      <slot name="more"></slot>
      <PopConfirmButton
        v-if="!$slots.more"
        :action="{ icon: 'ant-design:more-outlined', title: $t('table.more') }"
        class="tb-table-more-button"
      />
    </Popover>
  </div>
</template>
<style lang="less">
.tb-basic-table-action {
  display: flex;
  align-items: center;
  gap: 4px;

  &__popover-content.ant-popover-container {
    padding: 5px;

    .ant-popover-content {
      box-shadow: none;

      .ant-menu.ant-menu-horizontal {
        line-height: 34px;
        border: 0;
        padding: 0 5px;

        .ant-menu-item {
          margin: 0 -5px;
          padding-left: 14px;
        }
      }
    }
  }

  .action-divider {
    display: table;
  }

  &.left {
    justify-content: flex-start;
  }

  &.center {
    justify-content: center;
  }

  &.right {
    justify-content: flex-end;
  }

  .ant-divider,
  .ant-divider-vertical {
    margin: 0 2px;
  }

  .tb-table-more-button svg {
    transform: rotate(90deg);
  }
}
</style>
