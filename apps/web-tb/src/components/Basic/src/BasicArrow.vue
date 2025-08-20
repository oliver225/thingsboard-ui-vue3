<!-- eslint-disable unicorn/no-nested-ternary -->
<!--
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author Vben、ThinkGem
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Spin } from 'ant-design-vue';

const props = defineProps({
  /**
   * Arrow expand state
   */
  expand: { type: Boolean },
  /**
   * Arrow up by default
   */
  up: { type: Boolean },
  /**
   * Arrow down by default
   */
  down: { type: Boolean },
  /**
   * Cancel padding/margin for inline
   */
  inset: { type: Boolean },
  /**
   * 是否是叶子节点
   */
  leaf: { type: Boolean },
  /**
   * 是否双箭头图标
   */
  double: { type: Boolean },
  /**
   * 是否加载状态
   */
  loading: { type: Boolean, defaultValue: false },
  // eslint check
  onClick: { type: Function, default: (_e: Event) => {} },
  onDblclick: { type: Function, default: (_e: Event) => {} },
});

const emit = defineEmits(['click', 'dblclick']);

const prefixCls = 'basic-arrow';

const getIcon = computed(() => {
  const { leaf, double } = props;
  return leaf
    ? 'i-radix-icons:dot'
    : double
      ? 'mdi:chevron-double-right'
      : 'mdi:chevron-right';
});

// get component class
const getClass = computed(() => {
  const { expand, up, down, inset } = props;
  return [
    prefixCls,
    {
      [`${prefixCls}--active`]: expand,
      up,
      inset,
      down,
    },
  ];
});

function handleClick(event: any) {
  emit('click', event);
}

function handleDblClick(event: any) {
  emit('dblclick', event);
}
</script>
<template>
  <span :class="getClass" @click="handleClick" @dblclick="handleDblClick">
    <Spin v-if="props.loading" size="small" :style="$attrs.iconStyle" />
    <VbenIconButton v-else>
      <IconifyIcon :icon="getIcon" :style="$attrs.iconStyle" class="size-6" />
    </VbenIconButton>
  </span>
</template>
<style lang="less">
.basic-arrow {
  display: inline-block;
  cursor: pointer;
  transform: rotate(0deg);
  transition: all 0.3s ease 0.1s;
  transform-origin: center center;

  &--active {
    transform: rotate(90deg);
  }

  &.inset {
    line-height: 0;
  }

  &.up {
    transform: rotate(-90deg);
  }

  &.down {
    transform: rotate(90deg);
  }

  &.up.basic-arrow--active {
    transform: rotate(90deg);
  }

  &.down.basic-arrow--active {
    transform: rotate(-90deg);
  }
}
</style>
