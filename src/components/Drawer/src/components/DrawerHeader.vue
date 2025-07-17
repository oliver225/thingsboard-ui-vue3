<template>
  <BasicTitle v-if="!isDetail" :class="prefixCls">
    <slot name="title"></slot>
    {{ !$slots.title ? title : '' }}
  </BasicTitle>

  <div v-else>
    <div :class="[prefixCls, `${prefixCls}--detail`]">
      <div :class="`${prefixCls}__twrap`">
        <div>
          <span @click="handleClose" v-if="showDetailBack">
            <Icon icon="i-ant-design:arrow-left-outlined" :class="`${prefixCls}__back`" />
          </span>
          <span v-if="icon">
            <Icon :icon="icon" :class="`${prefixCls}__icon`" />
          </span>
        </div>
        <div>
          <span v-if="title">{{ title }}</span>
          <span v-if="secondTitle">{{ secondTitle }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { BasicTitle } from '/@/components/Basic';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { propTypes } from '/@/utils/propTypes';

  export default defineComponent({
    name: 'BasicDrawerHeader',
    components: { Icon, BasicTitle },
    props: {
      icon: propTypes.string,
      isDetail: propTypes.bool,
      showDetailBack: propTypes.bool,
      title: propTypes.string,
      secondTitle: propTypes.string,
    },
    emits: ['close'],
    setup(_, { emit }) {
      const { prefixCls } = useDesign('basic-drawer-header');

      function handleClose() {
        emit('close');
      }

      return { prefixCls, handleClose };
    },
  });
</script>

<style lang="less">
  @prefix-cls: ~'jeesite-basic-drawer-header';
  @footer-height: 60px;

  .@{prefix-cls} {
    display: flex;
    height: 100%;
    align-items: center;

    &__back {
      padding: 0 12px;
      cursor: pointer;

      &:hover {
        color: @primary-color;
      }
    }

    &__twrap {
      display: flex;
      align-items: center;
    }

    &__toolbar {
      padding-right: 50px;
    }
  }
</style>
