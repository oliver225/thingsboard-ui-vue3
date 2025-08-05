<template>
  <div class="ant-color-alpha-slider" :class="{ 'is-vertical': vertical }">
    <div
      ref="bar"
      class="ant-color-alpha-slider__bar"
      :style="{
        background,
      }"
      @click="handleClick"
    ></div>
    <div ref="thumb" class="ant-color-alpha__thumb" :style="{ left: thumbLeft + 'px', top: thumbTop + 'px' }"></div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, getCurrentInstance, shallowRef, watch, onMounted } from 'vue';
  import { propTypes } from '/@/utils/propTypes';
  import draggable from '../lib/draggable';
  import type Color from '../lib/color';

  export default defineComponent({
    name: 'AlphaSlider',
    props: {
      color: Object as PropType<Color>,
      vertical: propTypes.bool.def(false),
    },
    setup(props, { emit }) {
      const instance = getCurrentInstance();

      // ref
      const bar = shallowRef<Nullable<HTMLElement>>(null);
      const thumb = shallowRef<Nullable<HTMLElement>>(null);

      // data
      const thumbLeft = ref<number>(0);
      const thumbTop = ref<number>(0);
      const background = ref<Nullable<string>>(null);

      // watch
      watch(
        () => props.color?.get('alpha'),
        () => {
          update();
        },
      );
      watch(
        () => props.color?.value,
        () => {
          update();
        },
      );

      // methods
      function handleClick(event: Event) {
        const target = event.target;

        if (target !== thumb.value) {
          handleDrag(event);
        }
      }
      function handleDrag(event) {
        const ele = instance?.vnode.el as HTMLElement;
        const rect = ele.getBoundingClientRect();

        if (!props.vertical) {
          let left = event.clientX - rect.left;
          left = Math.max((thumb.value as HTMLElement).offsetWidth / 2, left);
          left = Math.min(left, rect.width - (thumb.value as HTMLElement).offsetWidth / 2);

          props.color?.set(
            'alpha',
            Math.round(
              ((left - (thumb.value as HTMLElement).offsetWidth / 2) /
                (rect.width - (thumb.value as HTMLElement).offsetWidth)) *
                100,
            ),
          );
        } else {
          let top = event.clientY - rect.top;
          top = Math.max((thumb.value as HTMLElement).offsetHeight / 2, top);
          top = Math.min(top, rect.height - (thumb.value as HTMLElement).offsetHeight / 2);

          props.color?.set(
            'alpha',
            Math.round(
              ((top - (thumb.value as HTMLElement).offsetHeight / 2) /
                (rect.height - (thumb.value as HTMLElement).offsetHeight)) *
                100,
            ),
          );
        }
      }
      function update() {
        thumbLeft.value = getThumbLeft();
        thumbTop.value = getThumbTop();
        background.value = getBackground();
      }
      function getThumbLeft(): number {
        if (props.vertical) return 0;
        const ele = instance?.vnode.el;
        const alpha = props.color?.get('alpha');

        if (!ele) return 0;
        return Math.round((alpha * (ele.offsetWidth - (thumb.value as HTMLElement).offsetWidth / 2)) / 100);
      }
      function getThumbTop(): number {
        const ele = instance?.vnode.el;
        if (!props.vertical) return 0;
        const alpha = props.color?.get('alpha');

        if (!ele) return 0;
        return Math.round((alpha * (ele.offsetHeight - (thumb.value as HTMLElement).offsetHeight / 2)) / 100);
      }
      function getBackground() {
        if (props.color && props.color.value) {
          const { r, g, b } = props.color.toRgb();
          return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0) 0%, rgba(${r}, ${g}, ${b}, 1) 100%)`;
        }
        return null;
      }

      onMounted(() => {
        const dragConfig = {
          drag: (event) => {
            handleDrag(event);
          },
          end: (event) => {
            handleDrag(event);
          },
        };

        draggable(bar.value as HTMLElement, dragConfig);
        draggable(thumb.value as HTMLElement, dragConfig);
        update();
      });
      return {
        bar,
        thumb,
        background,
        handleClick,
        thumbLeft,
        thumbTop,
        update,
      };
    },
  });
</script>
<style lang="less">
  .ant-color-alpha-slider {
    box-sizing: border-box;
    position: relative;
    width: 280px;
    height: 12px;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==);

    .ant-color-alpha-slider__bar {
      position: relative;
      background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%);
      height: 100%;
    }

    .ant-color-alpha__thumb {
      position: absolute;
      cursor: pointer;
      box-sizing: border-box;
      left: 0;
      top: 0;
      width: 4px;
      height: 100%;
      border-radius: 1px;
      background: #fff;
      border: 1px solid #f0f0f0;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
      z-index: 1;
    }

    &.is-vertical {
      width: 20px;
      height: 180px;

      .ant-color-alpha-slider__bar {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%);
      }

      .ant-color-alpha__thumb {
        left: 0;
        top: 0;
        width: 100%;
        height: 4px;
      }
    }
  }
</style>
