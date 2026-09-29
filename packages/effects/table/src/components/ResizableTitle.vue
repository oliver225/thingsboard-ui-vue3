<script lang="ts" setup name="ResizableTitle">
import type { BasicColumn } from '../index';

import { onBeforeUnmount, ref } from 'vue';

interface ResizeInfo {
  size: {
    width: number;
  };
}

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  column?: BasicColumn;
  onResize?: (event: MouseEvent, info: ResizeInfo) => void;
}>();

const dragging = ref(false);
const stopNextClick = ref(false);
let startX = 0;
let startWidth = 0;

const onMouseMove = (event: MouseEvent) => {
  if (!dragging.value) {
    return;
  }
  stopNextClick.value = true;
  const nextWidth = Math.max(startWidth + event.clientX - startX, 40);
  props.onResize?.(event, { size: { width: nextWidth } });
};

const onMouseUp = () => {
  dragging.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  setTimeout(() => {
    stopNextClick.value = false;
  }, 0);
};

const onMouseDown = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  dragging.value = true;
  stopNextClick.value = false;
  startX = event.clientX;
  startWidth =
    (props.column?.width as number) ||
    (event.currentTarget as HTMLElement).parentElement?.offsetWidth ||
    0;
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

const onClickCapture = (event: MouseEvent) => {
  if (stopNextClick.value) {
    event.stopPropagation();
    event.preventDefault();
    stopNextClick.value = false;
  }
};

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});
</script>
<template>
  <th
    v-if="!props.column?.resizable || !props.column?.width"
    v-bind="$attrs"
    @clickCapture="onClickCapture"
  >
    <slot></slot>
  </th>
  <th
    v-else
    v-bind="$attrs"
    class="resizable-title"
    :class="[$attrs.class]"
    :style="{ ...($attrs.style as any), width: `${props.column?.width}px` }"
    @clickCapture="onClickCapture"
  >
    <slot></slot>
    <span
      class="resizable-handle"
      :class="[{ dragging }]"
      @mousedown="onMouseDown"
    ></span>
  </th>
</template>
<style lang="less">
.resizable-title {
  position: relative;

  &.ant-table-cell-fix {
    position: sticky;
  }
}

.resizable-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  user-select: none;

  &:hover {
    border-left: rgb(170 170 170 / 30%) solid 2px;
  }

  &.dragging {
    border-left: rgb(170 170 170 / 90%) solid 2px;
  }
}
</style>
