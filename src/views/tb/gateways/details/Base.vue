<template>
  <div class="gateway-base-wrap">
    <BaseDeviceTable />

    <BaseAlarmTable />
  </div>
</template>

<script lang="ts" setup name="GatewayBase">
  import BaseAlarmTable from './BaseComp/BaseAlarmTable.vue';
  import BaseDeviceTable from './BaseComp/BaseDeviceTable.vue';
</script>

<style lang="less" scoped>
  .gateway-base-wrap {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  :deep(.ant-card-body) {
    padding: 12px !important;
  }
</style>
