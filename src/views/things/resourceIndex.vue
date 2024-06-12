<template>
  <PageWrapper class="resource-index">
    <Segmented v-model:value="selected" :options="resourceTabList" size="large" />
    <div class="mb-2"></div>
    <WidgetsBundle v-if="selected == 'WIDGETS'" />
    <ImageList v-if="selected == 'IMAGES'" />
    <ResourceLibrary v-if="selected == 'RESOURCE'" />
  </PageWrapper>
</template>
<script lang="ts">
export default {
  name: 'ResourceIndex',
};
</script>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { PageWrapper } from '/@/components/Page';
import { Segmented } from 'ant-design-vue';
import ResourceLibrary from '/@/views/things/resourceLibrary/list.vue';
import WidgetsBundle from '/@/views/things/widgetsBundle/list.vue';
import ImageList from '/@/views/things/images/list.vue';


const resourceTabList = reactive([{ value: 'WIDGETS', label: '部件包', className: 'segment-tab' },{ value: 'IMAGES', label: '图片集', className: 'segment-tab' }, { value: 'RESOURCE', label: '资源库', className: 'segment-tab' }]);
const selected = ref('WIDGETS');


onMounted(async () => {
  initTabList();
});

function initTabList() {
  selected.value = 'WIDGETS'

}
</script>
<style lang="less">
.resource-index {
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
