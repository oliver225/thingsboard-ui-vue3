<template>
  <div class="ant-color-hue-slider" :class="{ 'is-vertical': vertical }">
    <div ref="bar" class="ant-color-hue-slider__bar" @click="handleClick"></div>
    <div
      ref="thumb"
      class="ant-color-hue-slider__thumb"
      :style="{
        left: thumbLeft + 'px',
        top: thumbTop + 'px',
      }"
    ></div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, onMounted, getCurrentInstance, watch } from 'vue';
  import draggable from '../lib/draggable';
  import { propTypes } from '/@/utils/propTypes';

  import type Color from '../lib/color';

  export default defineComponent({
    name: 'HueSlider',
    props: {
      color: Object as PropType<Color>,
      vertical: propTypes.bool.def(false),
    },
    setup(props) {
      const instance = getCurrentInstance();

      // ref
      const thumb = ref<Nullable<HTMLElement>>(null);
      const bar = ref<Nullable<HTMLElement>>(null);

      // data
      const thumbLeft = ref(0);
      const thumbTop = ref(0);

      // computed
      const hueValue = computed(() => props.color.get('hue'));

      // watch
      watch(
        () => hueValue.value,
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
        let hue;

        if (!props.vertical) {
          let left = event.clientX - rect.left;
          left = Math.min(left, rect.width - (thumb.value as HTMLElement).offsetWidth / 2);
          left = Math.max((thumb.value as HTMLElement).offsetWidth / 2, left);

          hue = Math.round(
            ((left - (thumb.value as HTMLElement).offsetWidth / 2) /
              (rect.width - (thumb.value as HTMLElement).offsetWidth)) *
              360,
          );
        } else {
          let top = event.clientY - rect.top;

          top = Math.min(top, rect.height - (thumb.value as HTMLElement).offsetHeight / 2);
          top = Math.max((thumb.value as HTMLElement).offsetHeight / 2, top);
          hue = Math.round(
            ((top - (thumb.value as HTMLElement).offsetHeight / 2) /
              (rect.height - (thumb.value as HTMLElement).offsetHeight)) *
              360,
          );
        }
        props.color.set('hue', hue);
      }
      function getThumbLeft(): number {
        const ele = instance?.vnode.el as HTMLElement;

        if (props.vertical) return 0;
        const hue = props.color.get('hue');

        if (!ele) return 0;
        return Math.round((hue * (ele.offsetWidth - (thumb.value as HTMLElement).offsetWidth / 2)) / 360);
      }
      function getThumbTop(): number {
        const ele = instance?.vnode.el as HTMLElement;
        if (!props.vertical) return 0;
        const hue = props.color.get('hue');

        if (!ele) return 0;
        return Math.round((hue * (ele.offsetHeight - (thumb.value as HTMLElement).offsetHeight / 2)) / 360);
      }
      function update() {
        thumbLeft.value = getThumbLeft();
        thumbTop.value = getThumbTop();
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
        thumb,
        bar,
        thumbLeft,
        thumbTop,
        hueValue,
        handleClick,
        update,
      };
    },
  });
</script>

<style lang="less">
  .ant-color-hue-slider {
    box-sizing: border-box;
    position: relative;
    width: 280px;
    height: 12px;
    background-color: red;

    //float: right;
    &.is-vertical {
      width: 12px;
      height: 180px;
      padding: 2px 0;

      .ant-color-hue-slider__bar {
        background: linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
      }

      .ant-color-hue-slider__thumb {
        left: 0;
        top: 0;
        width: 100%;
        height: 4px;
      }
    }

    .ant-color-hue-slider__bar {
      position: relative;
      background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
      height: 100%;
    }

    .ant-color-hue-slider__thumb {
      box-sizing: border-box;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      width: 4px;
      height: 100%;
      border-radius: 1px;
      background-color: #ffffff;
      border: 1px solid #f0f0f0;
      box-shadow: 0 0 2px #0009;
      cursor: pointer;
    }
  }
</style>
