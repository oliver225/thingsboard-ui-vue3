<template>
  <div class="tbv3-text">
    <!-- eslint-disable vue/no-v-html -->
    <div v-if="isHtml" v-html="labelValue || value" class="p-1"></div>
    <div v-else>
      {{ labelValue || value }}
    </div>
  </div>
</template>
<script lang="ts" setup name="TbV3Text">
  import { propTypes } from '/@/utils/propTypes';

  defineProps({
    value: {
      type: [Array, Object, String, Number] as PropType<Array<any> | object | string | number>,
    },
    labelValue: {
      type: [Array, Object, String, Number] as PropType<Array<any> | object | string | number>,
    },
    isHtml: propTypes.bool,
  });
</script>
<style lang="less">
  @prefix-cls: ~'tbv3-text';

  .@{prefix-cls} {
    width: 100%;
    //border: 1px solid #ddd;
    //padding: 4px 8px;
    //border-radius: 5px;
  }
</style>
