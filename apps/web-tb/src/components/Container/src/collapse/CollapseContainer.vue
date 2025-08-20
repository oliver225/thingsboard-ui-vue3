<script lang="ts" setup>
import type { PropType } from 'vue';

import { ref, watch } from 'vue';

import { useTimeoutFn } from '@vueuse/core';
// component
import { Skeleton } from 'ant-design-vue';

import { CollapseTransition } from '#/components/Transition';
// hook
import { triggerResize } from '#/utils/event';

import CollapseHeader from './CollapseHeader.vue';

const props = defineProps({
  title: { type: String, default: '' },
  loading: { type: Boolean },
  /**
   *  Can it be expanded
   */
  canExpan: { type: Boolean, default: true },
  /**
   *  expanded
   */
  expand: { type: Boolean, default: true },
  /**
   * Warm reminder on the right side of the title
   */
  helpMessage: {
    type: [Array, String] as PropType<string | string[]>,
    default: '',
  },
  /**
   * Whether to trigger window.resize when expanding and contracting,
   * Can adapt to tables and forms, when the form shrinks, the form triggers resize to adapt to the height
   */
  triggerWindowResize: { type: Boolean },
  /**
   * Delayed loading time
   */
  lazyTime: { type: Number, default: 0 },
});

const emit = defineEmits(['update:expand']);

const show = ref(true);

const prefixCls = 'collapse-container';

watch(
  () => props.expand,
  (newExpand) => {
    if (show.value !== newExpand) {
      handleExpand();
    }
  },
  { immediate: true },
);

/**
 * @description: Handling development events
 */
function handleExpand() {
  show.value = !show.value;
  if (props.triggerWindowResize) {
    // 200 milliseconds here is because the expansion has animation,
    useTimeoutFn(triggerResize, 200);
  }
  emit('update:expand', show.value);
}
</script>
<template>
  <div :class="prefixCls">
    <CollapseHeader
      v-bind="$props"
      :prefix-cls="prefixCls"
      :show="show"
      @expand="handleExpand"
    >
      <template #title>
        <slot name="title"></slot>
      </template>
      <template #action>
        <slot name="action"></slot>
      </template>
    </CollapseHeader>

    <div class="p-2" v-show="show">
      <CollapseTransition :enable="canExpan">
        <Skeleton v-if="loading" :active="loading" />
        <div :class="`${prefixCls}__body`" v-else>
          <slot></slot>
        </div>
      </CollapseTransition>
    </div>
    <div :class="`${prefixCls}__footer`" v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
<style lang="less">
.collapse-container {
  background-color: hsl(var(--bg));
  border-radius: var(--radius);
  transition: all 0.3s ease-in-out;

  &__header {
    display: flex;
    height: 32px;
    justify-content: space-between;
    align-items: center;
    border-top-left-radius: var(--radius);
    border-top-right-radius: var(--radius);
    border-bottom: 1px solid hsl(var(--border));
    background-color: hsl(var(--border) / 0.4);
  }

  &__footer {
    border-top: 1px solid hsl(var(--border));
  }

  &__action {
    display: flex;
    text-align: right;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
