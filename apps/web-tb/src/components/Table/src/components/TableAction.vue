<script lang="ts">
import type { TooltipProps } from 'ant-design-vue';

import type { PropType } from 'vue';

import type { ActionItem } from '#/components/Table';

import { computed, defineComponent, toRaw } from 'vue';

import { isBoolean, isFunction, isString } from '@vben/utils';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { Divider, Popover, Tooltip } from 'ant-design-vue';

import { BaiceButton, PopConfirmButton } from '#/components/PopButton';
import { usePermission } from '#/hooks/web/usePermission';
import { propTypes } from '#/utils/propTypes';

const props = {
  actions: {
    type: Array as PropType<ActionItem[]>,
    default: null,
  },
  dropDownActions: {
    type: Array as PropType<ActionItem[]>,
    default: null,
  },
  divider: propTypes.bool.def(true),
  outside: propTypes.bool.def(false),
  stopButtonPropagation: propTypes.bool.def(false),
  align: propTypes.string,
};

export default defineComponent({
  name: 'TableAction',
  components: {
    VbenIcon,
    Divider,
    Tooltip,
    BaiceButton,
    Popover,
    PopConfirmButton,
  },
  props,
  setup(props: any) {
    const prefixCls = 'basic-table-action';

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

    const getActions = computed(() => {
      return (toRaw(props.actions) || [])
        .filter((action: ActionItem) => {
          return hasPermission(action.auth) && isIfShow(action);
        })
        .map((action: ActionItem) => {
          const { popConfirm } = action;
          return {
            // getPopupContainer: () => unref((table as any)?.wrapRef.value) ?? document.body, // 子表按钮被挤到一列
            type: 'link',
            size: 'small',
            ...action,
            ...popConfirm,
            iconTitle: action.title,
            onConfirm: popConfirm?.confirm,
            onCancel: popConfirm?.cancel,
            enable: !!popConfirm,
          };
        });
    });

    const getDropdownList = computed((): any[] => {
      const list = (toRaw(props.dropDownActions) || []).filter(
        (action: any) => {
          return hasPermission(action.auth) && isIfShow(action);
        },
      );
      return list.map((action: any, index: number) => {
        const { label, popConfirm } = action;
        return {
          ...action,
          ...popConfirm,
          iconTitle: action.title,
          onConfirm: popConfirm?.confirm,
          onCancel: popConfirm?.cancel,
          text: label,
          divider: index < list.length - 1 ? action.divider : false,
        };
      });
    });

    const getAlign = computed(() => {
      if (props.align) return props.align;
      return 'center';
    });

    function getTooltip(data: string | TooltipProps): TooltipProps {
      return {
        getPopupContainer: () => document.body,
        placement: 'top',
        ...(isString(data) ? { title: data } : data),
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
      prefixCls,
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
  <div :class="[prefixCls, getAlign]" @click="onCellClick">
    <template
      v-for="(action, index) in getActions"
      :key="`${index}-${action.label}`"
    >
      <Tooltip v-if="action.tooltip" v-bind="getTooltip(action.tooltip)">
        <PopConfirmButton v-bind="action">
          <VbenIcon
            :icon="action.icon"
            class="size-5"
            :class="{ 'mr-1': !!action.label }"
            :title="action.iconTitle"
            v-if="action.icon"
          />
          <template v-else-if="action.label">
            <span :title="action.iconTitle">{{ action.label }}</span>
          </template>
        </PopConfirmButton>
      </Tooltip>
      <PopConfirmButton v-else v-bind="action">
        <VbenIcon
          :icon="action.icon"
          class="size-5"
          :class="{ 'mr-1': !!action.label }"
          :title="action.iconTitle"
          v-if="action.icon"
        />
        <template v-if="action.label">
          <span :title="action.iconTitle">{{ action.label }}</span>
        </template>
      </PopConfirmButton>
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
      <BaiceButton type="link" v-if="!$slots.more">
        <VbenIcon icon="i-ant-design:more-outlined" class="icon-more" />
      </BaiceButton>
    </Popover>
  </div>
</template>
<style lang="less">
@prefix-cls: ~'basic-table-action';

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

  button.ant-btn,
  button.ant-btn.ant-btn-sm {
    display: flex;
    align-items: center;
    padding: 3px 6px;
  }

  .ant-divider,
  .ant-divider-vertical {
    margin: 0 2px;
  }

  .icon-more {
    transform: rotate(90deg);
  }

  .anticon {
    font-size: 18px;
  }
}
</style>
