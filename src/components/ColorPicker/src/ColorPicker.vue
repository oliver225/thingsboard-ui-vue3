<template>
  <a-input
    :style="{ width }"
    :placeholder="t('component.icon.placeholder')"
    :class="prefixCls"
    v-model:value="currentColor"
  >
    <template #addonAfter>
      <ColorPicker v-model:modelValue="currentColor" @change="handleChange" />
    </template>
  </a-input>
</template>
<script lang="ts" setup>
  import { ref, watchEffect, watch } from 'vue';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { Input } from 'ant-design-vue';
  import ColorPicker from './SimpleColorPicker.vue';

  import { propTypes } from '/@/utils/propTypes';
  import { useI18n } from '/@/hooks/web/useI18n';

  // 没有使用别名引入，是因为WebStorm当前版本还不能正确识别，会报unused警告
  const AInput = Input;

  const props = defineProps({
    value: propTypes.string,
    width: propTypes.string.def('100%'),
    pageSize: propTypes.number.def(70),
    copy: propTypes.bool.def(false),
    mode: propTypes.oneOf(['svg', 'iconify']).def('iconify'),
  });

  const emit = defineEmits(['change', 'update:value']);

  const currentColor = ref('');

  const { t } = useI18n();
  const { prefixCls } = useDesign('color-picker');

  watchEffect(() => {
    currentColor.value = props.value;
  });

  watch(
    () => currentColor.value,
    (v) => {
      emit('update:value', v);
      return emit('change', v);
    },
  );

  function handleChange(value) {
    currentColor.value = value;
  }
</script>

<style lang="less">
  @prefix-cls: ~'jeesite-color-picker';

  .@{prefix-cls} {
    .ant-input-group-addon {
      padding: 0 !important;
    }
    .ant3-color-picker {
      height: 31px;
      padding: 0;
      border: 0;
      display: block;
      .el-color-picker__color {
        border: 0;
      }
      .el-color-picker__color-inner {
        border: 0;
        border-radius: 0 6px 6px 0;
        line-height: 31px;
      }
    }
  }
</style>
