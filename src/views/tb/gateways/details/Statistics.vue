<template>
  <div class="statistics-container">
    <!-- 顶部操作栏 -->
    <div class="header-actions">
      <!-- 模式切换器 -->
      <Segmented v-model:value="activeMode" :options="segmentedOptions">
        <template #label="{ payload = {} }">
          <span style="padding: 4px 4px">
            <template v-if="payload.icon">
              <Icon :icon="payload.icon" :size="16" />
            </template>
            {{ payload.content }}
          </span>
        </template>
      </Segmented>

      <!-- 时间筛选器 -->
      <TimeFilter ref="timeFilterRef" @apply="handleTimeFilterApply" />
    </div>

    <!-- Storage 模式内容 -->
    <StorageStatistics
      v-show="activeMode === 'storage'"
      :is-active="activeMode === 'storage'"
      :gateway-id="gatewayId"
      :time-params="timeFilterParams"
    />

    <!-- Machine 模式内容 -->
    <MachineStatistics
      v-show="activeMode === 'machine'"
      :is-active="activeMode === 'machine'"
      :gateway-id="gatewayId"
      :time-params="timeFilterParams"
    />
  </div>
</template>

<script lang="ts" setup name="GatewayDetailHeader">
  import { computed, onMounted, ref } from 'vue';
  import { Segmented } from 'ant-design-vue';
  import { useRoute, useRouter } from 'vue-router';

  import { Icon } from '/@/components/Icon';

  import StorageStatistics from './StatisticsComp/StorageStatistics.vue';
  import MachineStatistics from './StatisticsComp/MachineStatistics.vue';
  import TimeFilter from './ConnectorsComp/base/TimeFilter.vue';

  import { useI18n } from '/@/hooks/web/useI18n';

  const emit = defineEmits([]);
  const { t } = useI18n('tb');
  const route = useRoute();

  const gatewayId = route.params.gatewayId as string;

  defineProps({
    gatewayName: {
      type: String,
      default: () => '',
    },
  });

  // 模式切换
  const activeMode = ref('storage');

  // Ant Design Segmented 组件配置
  const segmentedOptions = computed(() => [
    {
      payload: {
        icon: 'ant-design:database-outlined',
        content: t('tb.gateway.statistics.segmented.storage'),
      },
      value: 'storage',
    },
    {
      payload: {
        icon: 'ant-design:experiment-outlined',
        content: t('tb.gateway.statistics.segmented.machine'),
      },
      value: 'machine',
    },
  ]);

  //---------------- 时间筛选器 ------------------

  const timeFilterParams = ref();
  const timeFilterRef = ref();

  onMounted(() => {
    const initialParmas = timeFilterRef.value.getInitialParams(['serviceStats', 'machineStats']);
    timeFilterParams.value = initialParmas;
  });

  // 处理时间筛选应用
  function handleTimeFilterApply() {
    const initialParmas = timeFilterRef.value.getInitialParams(['serviceStats', 'machineStats']);
    timeFilterParams.value = initialParmas;
  }
</script>

<style lang="less" scoped>
  .statistics-container {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .header-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;

      :deep(.ant-segmented) {
        flex: 0 0 auto;
      }
    }
  }

  @media (max-width: 768px) {
    .statistics-container .header-actions {
      flex-direction: column;
      align-items: stretch;

      :deep(.ant-segmented) {
        width: 100%;
      }
    }
  }
</style>
