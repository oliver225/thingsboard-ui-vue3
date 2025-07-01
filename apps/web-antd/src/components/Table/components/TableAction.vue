<script lang="ts">
import type { PropType } from 'vue';

import type { TippyProps } from '@vben/common-ui';

import type { ActionItem } from '../types/tableAction';

import { computed, defineComponent, toRaw } from 'vue';

import { IconifyIcon, MaterialMore } from '@vben/icons';
import { isBoolean, isFunction, isString } from '@vben/utils';

import { Button, Divider, Popover } from 'ant-design-vue';

const props = {
  actions: {
    type: Array as PropType<ActionItem[]>,
    default: null,
  },
  dropDownActions: {
    type: Array as PropType<ActionItem[]>,
    default: null,
  },
  divider: {
    type: Boolean,
    default: true,
  },
  outside: {
    type: Boolean,
    default: false,
  },
  stopButtonPropagation: {
    type: Boolean,
    default: false,
  },
  align: {
    type: String,
  },
  params: {
    type: Object,
  },
};

export default defineComponent({
  name: 'TableAction',
  components: {
    Button,
    IconifyIcon,
    Divider,
    Popover,
    MaterialMore,
  },
  props,
  setup(props: any) {
    function isIfShow(action: any): boolean {
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

    function isDisabledFn(action: any): boolean {
      const disabled = action.disabled;

      let isDisabled = false;

      if (isBoolean(disabled)) {
        isDisabled = disabled;
      }
      if (isFunction(disabled)) {
        isDisabled = disabled(action);
      }
      return isDisabled;
    }

    const getActions = computed(() => {
      return (toRaw(props.actions) || [])
        .filter((action: ActionItem) => {
          return isIfShow({ ...props.params, ifShow: action.ifShow });
        })
        .map((action: any) => {
          return {
            // getPopupContainer: () => unref((table as any)?.wrapRef.value) ?? document.body, // 子表按钮被挤到一列
            type: 'link',
            size: 'small',
            ...action,
            disabled: isDisabledFn({
              ...props.params,
              disabled: action.disabled,
            }),
            onClick: () => {
              action.onClick?.(props.params);
            },
          };
        });
    });

    const getDropdownList = computed((): any[] => {
      const list = (toRaw(props.dropDownActions) || []).filter(
        (action: any) => {
          return isIfShow(action);
        },
      );
      return list.map((action: any, index: any) => {
        const { label } = action;
        return {
          ...action,
          iconTitle: action.title,
          text: label,
          // divider: index < list.length - 1 ? props.divider : false,
          divider: index < list.length - 1 ? action.divider : false,
          onClick: () => {
            action.onClick?.(props.params);
          },
        };
      });
    });

    const getAlign = computed(() => {
      if (props.align) return props.align;
      return 'center';
    });

    function getTooltip(data: string | TippyProps): TippyProps {
      return {
        placement: 'top',
        theme: 'dark',
        ...(isString(data) ? { content: data } : data),
      };
    }

    function onCellClick(e: MouseEvent) {
      if (!props.stopButtonPropagation) return;
      const path = e.composedPath() as HTMLElement[];
      const isInButton = path.find((ele) => {
        return ele.tagName?.toUpperCase() === 'BUTTON';
      });
      isInButton && e.stopPropagation();
    }

    return {
      props,
      getActions,
      getDropdownList,
      getAlign,
      onCellClick,
      getTooltip,
    };
  },
});
</script>
<template>
  <div :class="[getAlign]" @click="onCellClick">
    <template
      v-for="(action, index) in getActions"
      :key="`${index}-${action.label}`"
    >
      <Button
        class="ant-btn-success"
        v-bind="action"
        v-tippy="getTooltip(action.tooltip)"
        icon=""
      >
        <IconifyIcon class="size-4" :icon="action.icon" v-if="action.icon" />
        <template v-else-if="action.label">
          <span>{{ action.label }}</span>
        </template>
      </Button>
      <Divider
        type="vertical"
        class="action-divider"
        v-if="props.divider && index < getActions.length - 1"
      />
    </template>
    <Popover
      v-if="props.dropDownActions && getDropdownList.length > 0"
      :trigger="['hover']"
      :drop-menu-list="getDropdownList"
      popconfirm
    >
      <slot name="more"></slot>
      <Button type="link" size="small" v-if="!$slots.more">
        <MaterialMore class="icon-more" />
      </Button>
    </Popover>
  </div>
</template>
<style lang="less">
@prefix-cls: ~'table-action';

.@{prefix-cls} {
  display: flex;
  align-items: center;

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

  button {
    display: flex;
    align-items: center;

    span {
      margin-left: 0 !important;
    }
  }

  .ant-divider,
  .ant-divider-vertical {
    margin: 0 2px;
  }

  .icon-more {
    transform: rotate(90deg);

    svg {
      font-size: 1.1em;
      font-weight: 700;
      vertical-align: baseline;
    }
  }
}
</style>
