<script lang="ts" setup name="AButton">
import { computed, unref } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { Button } from 'ant-design-vue';

import { useAttrs } from '#/hooks/core/useAttrs';

import { buttonProps } from './props';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps(buttonProps);

const attrs = useAttrs({ excludeDefaultKeys: false });
const getButtonClass = computed(() => {
  const { color, disabled } = props;
  return [
    {
      [`ant-btn-${color}`]: !!color,
      [`is-disabled`]: disabled,
    },
  ];
});

const getButtonStyle = computed(() => {
  const { color } = props;
  return color
    ? {
        color: `hsl(var(--${color}))`,
      }
    : null;
});

const getBindValue = computed(() => ({ ...unref(attrs), ...props }));
</script>
<template>
  <Button
    v-bind="getBindValue"
    :style="getButtonStyle"
    :class="getButtonClass"
    @click="onClick"
  >
    <template #default="data">
      <VbenIcon :icon="preIcon" v-if="preIcon" :size="iconSize" />
      <slot v-bind="data || {}"></slot>
      <VbenIcon :icon="postIcon" v-if="postIcon" :size="iconSize" />
    </template>
  </Button>
</template>
