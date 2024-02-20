<template>
  <PageWrapper class="profiles-index">
    <Segmented v-model:value="selected" :options="resourceTabList" size="large" />
    <div class="mb-2"></div>
    <DeviceProfile v-if="selected == 'DEVICE_PROFILE'" />
    <AssetProfile v-if="selected == 'ASSET_PROFILE'" />
  </PageWrapper>
</template>
<script lang="ts">
export default {
  name: 'ProfileIndex',
};
</script>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { PageWrapper } from '/@/components/Page';
import { Segmented } from 'ant-design-vue';
import AssetProfile from '/@/views/things/assetProfile/list.vue';
import DeviceProfile from '/@/views/things/deviceProfile/list.vue';

const resourceTabList = reactive([{ value: 'DEVICE_PROFILE', label: '设备配置', className: 'segment-tab' }, { value: 'ASSET_PROFILE', label: '资产配置', className: 'segment-tab' }]);
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
  .jeesite-basic-table-header__header-top {
    display: none;
  }

  .jeesite-basic-table {
    padding: 0;
  }

  .segment-tab {
    font-weight: 600;

    .ant-segmented-item-label {
      margin: 0 8px;
    }
  }


}
</style>
