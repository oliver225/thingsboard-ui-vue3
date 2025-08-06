<template>
  <PageWrapper class="profiles-index">
    <Segmented v-model:value="selected" :options="resourceTabList" />
    <DeviceProfile v-if="selected == 'DEVICE_PROFILE'" />
    <AssetProfile v-if="selected == 'ASSET_PROFILE'" />
  </PageWrapper>
</template>
<script lang="ts">
  export default {
    name: 'ViewsTbProfileIndex',
  };
</script>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue';
  import { PageWrapper } from '/@/components/Page';
  import { Segmented } from 'ant-design-vue';
  import AssetProfile from '/@/views/tb/assetProfile/list.vue';
  import DeviceProfile from '/@/views/tb/deviceProfile/list.vue';

  const resourceTabList = reactive([
    { value: 'DEVICE_PROFILE', label: '设备配置', className: 'segment-tab' },
    { value: 'ASSET_PROFILE', label: '资产配置', className: 'segment-tab' },
  ]);
  const selected = ref('DEVICE_PROFILE');

  onMounted(async () => {
    initTabList();
  });

  function initTabList() {
    selected.value = 'DEVICE_PROFILE';
  }
</script>
<style lang="less">
  .profiles-index {
    .jeesite-basic-table-header-container {
      // display: none;
      .text-lg {
        display: none;
      }
    }

    .jeesite-basic-table {
      padding: 0;
    }

    .ant-segmented-item-selected {
      background-color: @primary-color !important;
      color: @white !important;
    }

    .segment-tab {
      padding: 2px 6px;
      font-weight: 600;
      font-size: 0.95rem;
      line-height: 1.75rem;
    }
  }
</style>
