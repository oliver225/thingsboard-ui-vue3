<template>
  <PageWrapper class="widgets-library-index">
    <Segmented size="large" v-model:value="currentView" :options="resourceTabList" @change="handleViewChange" />
    <WidgetType v-if="currentView === 'widget-types'" />
    <WidgetsBundle v-if="currentView === 'widgets-bundles'" />
  </PageWrapper>
</template>

<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbWidgetLibraryIndex',
  });
</script>

<script lang="ts" setup>
  import { defineComponent, reactive, ref, watch } from 'vue';
  import { PageWrapper } from '/@/components/Page';
  import { Segmented } from 'ant-design-vue';
  import { router } from '/@/router';
  import WidgetType from '/@/views/tb/widgetType/list.vue';
  import WidgetsBundle from '/@/views/tb/widgetsBundle/list.vue';
  import { useI18n } from '/@/hooks/web/useI18n';

  const { t } = useI18n();

  const currentView = ref('widget-types');

  const resourceTabList = reactive([
    { value: 'widget-types', label: t('routes.tb.widgetType'), className: 'segment-tab' },
    { value: 'widgets-bundles', label: t('routes.tb.widgetsBundle'), className: 'segment-tab' },
  ]);

  function handleViewChange(value: any) {
    router.push({ path: `/widgets-library/${value}` });
  }

  // 根据当前路由设置视图
  watch(
    () => router.currentRoute.value.path,
    (newPath) => {
      if (newPath.includes('widgets-bundles')) {
        currentView.value = 'widgets-bundles';
      } else if (newPath.includes('widget-types')) {
        currentView.value = 'widget-types';
      }
    },
    { immediate: true },
  );
</script>
<style lang="less">
  .widgets-library-index {
    .ant-segmented-item-selected {
      background-color: @primary-color !important;
      color: @white !important;
    }

    .ant-segmented-item-label {
      padding: 0 20px !important;
    }
  }
</style>
