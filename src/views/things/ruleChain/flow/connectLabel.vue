<template>
  <div class="rule-chain-connect-label">
    <div class="content">
      {{ text }}
    </div>
  </div>
</template>
<script lang="ts" setup name="RuleChainConnectLabel">
import { propTypes } from '/@/utils/propTypes';

const props = defineProps({
  text: propTypes.string,
});
</script>
<style lang="less">
.rule-chain-connect-label {
  width: 100%;
  height: 80%;
  display: flex;
  justify-content: center;
  align-items: center;

  .content {
    font-size: 14px;
    line-height: 14px;
    background-color: #fff;
    color: @primary-color;
    font-weight: 600;
    border: 2px solid @primary-color;
    border-radius: 12px;
    padding: 4px 8px;
    cursor: pointer;
  }
}
</style>