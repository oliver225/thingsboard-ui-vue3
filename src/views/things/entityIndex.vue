<template>
  <PageWrapper class="entity-index">
    <Segmented v-model:value="selected" :options="resourceTabList" size="large" />
    <div class="mb-2"></div>
    <Asset v-if="selected == 'ASSET'" />
    <EntityView v-if="selected == 'ENTITY_VIEW'" />
  </PageWrapper>
</template>
<script lang="ts">
export default {
  name: 'EntityIndex',
};
</script>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { PageWrapper } from '/@/components/Page';
import { Segmented } from 'ant-design-vue';
import Asset from '/@/views/things/asset/list.vue';
import EntityView from '/@/views/things/entityView/list.vue';

const resourceTabList = reactive([{ value: 'ASSET', label: '资产', className: 'segment-tab' }, { value: 'ENTITY_VIEW', label: '实体视图', className: 'segment-tab' }]);
const selected = ref('ASSET');


onMounted(async () => {
  initTabList();
});

function initTabList() {
  selected.value = 'ASSET';

}
</script>
<style lang="less">
.entity-index {
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
