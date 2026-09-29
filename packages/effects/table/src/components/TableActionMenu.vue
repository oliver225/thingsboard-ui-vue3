<script lang="ts" setup name="BasicPopover">
import type { PropType } from 'vue';

import type { DropMenu } from '../types/action-menu';
import type { Recordable } from '../types/shared';
import type { ActionItem } from '../types/tableAction';

import { computed, ref, useAttrs } from 'vue';

import { Menu, Popover } from 'antdv-next';

import ActionButton from './TableActionButton.vue';

const props = defineProps({
  popconfirm: Boolean,
  trigger: {
    type: [Array] as PropType<('click' | 'contextMenu' | 'hover')[]>,
    default: () => {
      return ['contextMenu'];
    },
  },
  dropMenuList: {
    type: Array as PropType<(DropMenu & Recordable)[]>,
    default: () => [],
  },
  selectedKeys: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  placement: {
    type: String as PropType<
      | 'bottom'
      | 'bottomLeft'
      | 'bottomRight'
      | 'left'
      | 'leftBottom'
      | 'leftTop'
      | 'right'
      | 'rightBottom'
      | 'rightTop'
      | 'top'
      | 'topLeft'
      | 'topRight'
    >,
    default: 'left',
  },
  menuMode: {
    type: String as PropType<'horizontal' | 'inline' | 'vertical'>,
    default: 'horizontal',
  },
});
const emit = defineEmits(['menuEvent']);
const MenuItem = Menu.Item;
const MenuDivider = Menu.Divider;

const attrs = useAttrs();
const popoverClasses = computed(() => ({
  ...(attrs.classes as Record<string, string> | undefined),
  root: 'tb-basic-popover',
}));
const open = ref(false);
const openConfirmations = ref(new Set<number>());

const effectiveTrigger = computed(() => {
  // 当有 popconfirm 打开时，禁用自动触发（如 hover），防止鼠标移出 Popover 时关闭
  if (openConfirmations.value.size > 0) {
    return [];
  }
  return props.trigger;
});

function onPopconfirmOpenChange(index: number, visible: boolean) {
  if (visible) {
    openConfirmations.value.add(index);
  } else {
    openConfirmations.value.delete(index);
    open.value = false;
  }
}

function getMenuAction(item: DropMenu & Recordable): ActionItem {
  const confirmation = props.popconfirm ? item.popConfirm : undefined;
  return {
    ...item,
    label: item.text,
    title: item.iconTitle ?? item.title,
    popConfirm: confirmation,
    onClick: (...args: any[]) => {
      open.value = false;
      emit('menuEvent', item);
      return item.onClick?.(...args);
    },
  };
}

const getAttr = (key: number | string) => ({ key });
</script>
<template>
  <Popover
    :trigger="effectiveTrigger"
    v-bind="$attrs"
    v-model:open="open"
    :classes="popoverClasses"
    :mouse-enter-delay="0.05"
    :mouse-leave-delay="0.15"
    :placement="placement"
  >
    <span>
      <slot></slot>
    </span>
    <template #content>
      <Menu
        :selected-keys="selectedKeys"
        :mode="menuMode"
        :disabled-overflow="true"
      >
        <template v-for="(item, index) in dropMenuList" :key="`${index}`">
          <MenuItem v-bind="getAttr(`item-${index}`)" :disabled="item.disabled">
            <ActionButton
              :action="getMenuAction(item)"
              @confirm-open-change="onPopconfirmOpenChange(index, $event)"
            />
          </MenuItem>
          <MenuDivider v-if="item.divider" :key="`d-${item.event}`" />
        </template>
      </Menu>
    </template>
  </Popover>
</template>
<style lang="less">
.ant-popover.tb-basic-popover {
  .ant-menu {
    border: 0;
    border-radius: var(--radius);
    background: transparent;
  }

  .ant-menu-horizontal {
    line-height: 36px;

    > .ant-menu-item {
      height: auto;
      padding: 0;

      &::after {
        border-bottom: 0;
      }
    }
  }

  .ant-menu-title-content,
  .tb-table-action-trigger {
    display: inline-flex;
    width: 100%;
  }

  .tb-table-action-button {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
