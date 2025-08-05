<template>
  <div
    class="ant-color-svpanel"
    :style="{
      backgroundColor: background,
    }"
  >
    <div class="ant-color-svpanel__white"></div>
    <div class="ant-color-svpanel__black"></div>
    <div
      class="ant-color-svpanel__cursor"
      :style="{
        top: cursorTop + 'px',
        left: cursorLeft + 'px',
      }"
    >
      <div></div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch, getCurrentInstance, onMounted } from 'vue';
  import draggable from '../lib/draggable';

  import type Color from '../lib/color';

  export default defineComponent({
    name: 'SvPanel',
    props: {
      color: {
        type: Object as PropType<Color>,
      },
    },
    setup(props) {
      const instance = getCurrentInstance();

      // data
      const cursorTop = ref(0);
      const cursorLeft = ref(0);
      const background = ref('hsl(0, 100%, 50%)');

      // computed
      const colorValue = computed(() => {
        const hue = props.color?.get('hue');
        const value = props.color?.get('value');
        return { hue, value };
      });

      // watch
      watch(
        () => colorValue.value,
        () => {
          update();
        },
      );

      // methods
      function update() {
        const saturation = props.color?.get('saturation');
        const value = props.color?.get('value');

        const ele = instance?.vnode.el as HTMLElement;

        cursorLeft.value = (saturation * ele.clientWidth) / 100;
        cursorTop.value = ((100 - value) * ele.clientHeight) / 100;

        background.value = `hsl(${props.color?.get('hue')}, 100%, 50%)`;
      }
      function handleDrag(event) {
        const ele = instance?.vnode.el as HTMLElement;
        const rect = ele.getBoundingClientRect();

        let left = event.clientX - rect.left;
        let top = event.clientY - rect.top;

        left = Math.max(0, left);
        left = Math.min(left, rect.width);
        top = Math.max(0, top);
        top = Math.min(top, rect.height);

        cursorLeft.value = left;
        cursorTop.value = top;

        props.color?.set({
          saturation: (left / rect.width) * 100,
          value: 100 - (top / rect.height) * 100,
        });
      }

      onMounted(() => {
        const ele = instance?.vnode.el as HTMLElement;
        draggable(ele, {
          drag: (event) => {
            handleDrag(event);
          },
          end: (event) => {
            handleDrag(event);
          },
        });
      });

      return {
        cursorTop,
        cursorLeft,
        background,
        colorValue,
        handleDrag,
        update,
      };
    },
  });
</script>

<style lang="less">
  .ant-color-svpanel {
    position: relative;
    width: 280px;
    height: 180px;
    margin-right: 10px;

    .ant-color-svpanel__white,
    .ant-color-svpanel__black {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .ant-color-svpanel__white {
      background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
    }

    .ant-color-svpanel__black {
      background: linear-gradient(to top, #000, rgba(0, 0, 0, 0));
    }

    .ant-color-svpanel__cursor {
      position: absolute;

      > div {
        width: 4px;
        height: 4px;
        box-shadow:
          0 0 0 1.5px #fff,
          inset 0 0 1px 1px rgba(0, 0, 0, 0.3),
          0 0 1px 2px rgba(0, 0, 0, 0.4);
        border-radius: 50%;
        transform: translate(-2px, -2px);
      }
    }
  }
</style>
