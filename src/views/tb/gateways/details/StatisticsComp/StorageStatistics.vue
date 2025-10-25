<template>
  <div class="storage-statistics">
    <!-- 第一行：左侧数字统计 + 右侧推送数据点 -->
    <div class="first-row">
      <!-- 左侧：数字统计卡片列 -->
      <div class="stats-column">
        <!-- 存储消息数量 -->
        <div class="stat-card-compact">
          <div class="card-header">
            <span class="card-title">{{ t('tb.gateway.storage.storageMsgCount') }}</span>
          </div>
          <div class="card-content">
            <div class="big-number">{{ storageMessageCount }}</div>
            <div class="mini-chart" ref="storageChartRef"></div>
          </div>
        </div>

        <!-- 来自平台的消息 -->
        <div class="stat-card-compact">
          <div class="card-header">
            <span class="card-title">{{ t('tb.gateway.storage.messagesFromPlatform') }}</span>
          </div>
          <div class="card-content">
            <div class="big-number">{{ platformMessageCount }}</div>
            <div class="mini-chart" ref="platformChartRef"></div>
          </div>
        </div>
      </div>

      <!-- 右侧：推送数据点 -->
      <div class="chart-column">
        <div class="stat-card-large">
          <div class="card-header">
            <span class="card-title">{{ t('tb.gateway.storage.pushedDatapoints') }}</span>
            <div class="legend-list">
              <div class="legend-item">
                <span class="legend-dot" style="background: #52c41a"></span>
                <span class="legend-label">{{ t('tb.gateway.storage.legends.attributes') }}</span>
                <span class="legend-value">{{ dataPoints.attributes }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: #faad14"></span>
                <span class="legend-label">{{ t('tb.gateway.storage.legends.telemetry') }}</span>
                <span class="legend-value">{{ dataPoints.telemetry }}</span>
              </div>
            </div>
          </div>
          <div class="card-content">
            <div class="main-chart" ref="dataPointsChartRef"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第二行：消息统计 -->
    <div class="full-width-row">
      <div class="stat-card-large">
        <div class="card-header">
          <span class="card-title">{{ t('tb.gateway.storage.messages') }}</span>
          <div class="legend-list">
            <div class="legend-item">
              <span class="legend-dot" style="background: #52c41a"></span>
              <span class="legend-label">{{ t('tb.gateway.storage.legends.storagePulled') }}</span>
              <span class="legend-value">{{ messageStats.pulled }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #faad14"></span>
              <span class="legend-label">{{ t('tb.gateway.storage.legends.platformPushed') }}</span>
              <span class="legend-value">{{ messageStats.pushed }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #1890ff"></span>
              <span class="legend-label">{{ t('tb.gateway.storage.legends.platformSent') }}</span>
              <span class="legend-value">{{ messageStats.sent }}</span>
            </div>
          </div>
        </div>
        <div class="card-content">
          <div class="main-chart" ref="messageChartRef"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup name="StorageStatistics">
  import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
  import * as echarts from 'echarts';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { EntityFilterType, EntityKeyType } from '/@/enums/queryEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  const { t } = useI18n('tb');

  // Props
  const props = defineProps({
    gatewayId: {
      type: String,
      required: true,
    },
    timeParams: {
      type: Object,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  });

  // 图表 refs
  const storageChartRef = ref<HTMLElement>();
  const platformChartRef = ref<HTMLElement>();
  const messageChartRef = ref<HTMLElement>();
  const dataPointsChartRef = ref<HTMLElement>();

  // 图表实例
  let storageChart: echarts.ECharts | null = null;
  let platformChart: echarts.ECharts | null = null;
  let messageChart: echarts.ECharts | null = null;
  let dataPointsChart: echarts.ECharts | null = null;

  // 统计数据
  const storageMessageCount = ref(0);
  const platformMessageCount = ref(0);
  const messageStats = reactive({
    pulled: 0,
    pushed: 0,
    sent: 0,
  });
  const dataPoints = reactive({
    attributes: 0,
    telemetry: 0,
  });

  onMounted(() => {
    // 延迟初始化图表，确保 DOM 完全渲染
    nextTick(() => {
      initCharts();
    });
  });

  onUnmounted(() => {
    disposeCharts();
  });

  // 初始化图表
  function initCharts() {
    // 先销毁已存在的图表实例，避免重复初始化
    if (storageChart) {
      storageChart.dispose();
      storageChart = null;
    }
    if (platformChart) {
      platformChart.dispose();
      platformChart = null;
    }
    if (messageChart) {
      messageChart.dispose();
      messageChart = null;
    }
    if (dataPointsChart) {
      dataPointsChart.dispose();
      dataPointsChart = null;
    }

    // 初始化各个图表
    if (storageChartRef.value) {
      storageChart = echarts.init(storageChartRef.value);
      storageChart.setOption(getMiniChartOption());
    }

    if (platformChartRef.value) {
      platformChart = echarts.init(platformChartRef.value);
      platformChart.setOption(getMiniChartOption());
    }

    if (messageChartRef.value) {
      messageChart = echarts.init(messageChartRef.value);
      messageChart.setOption(getMessageChartOption());
    }

    if (dataPointsChartRef.value) {
      dataPointsChart = echarts.init(dataPointsChartRef.value);
      dataPointsChart.setOption(getDataPointsChartOption());
    }

    // 响应式调整
    window.removeEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
  }

  function disposeCharts() {
    window.removeEventListener('resize', handleResize);
    storageChart?.dispose();
    platformChart?.dispose();
    messageChart?.dispose();
    dataPointsChart?.dispose();
  }

  function handleResize() {
    storageChart?.resize();
    platformChart?.resize();
    messageChart?.resize();
    dataPointsChart?.resize();
  }

  // 迷你图表配置
  function getMiniChartOption() {
    return {
      grid: {
        left: 0,
        right: 0,
        top: 5,
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        show: false,
        data: [],
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          data: [],
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#1890ff',
            width: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0)' },
              ],
            },
          },
        },
      ],
    };
  }

  // 消息统计图表配置
  function getMessageChartOption() {
    return {
      legend: {
        show: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      grid: {
        left: 50,
        right: 20,
        top: 20,
        bottom: 60,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
      },
      yAxis: {
        type: 'value',
      },
      dataZoom: [
        {
          type: 'slider',
          start: 80,
          end: 100,
          height: 20,
          bottom: 10,
        },
        {
          type: 'inside',
          start: 80,
          end: 100,
        },
      ],
      series: [
        {
          name: t('tb.gateway.storage.legends.storagePulled'),
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#52c41a' },
        },
        {
          name: t('tb.gateway.storage.legends.platformPushed'),
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#faad14' },
        },
        {
          name: t('tb.gateway.storage.legends.platformSent'),
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#1890ff' },
        },
      ],
    };
  }

  // 数据点图表配置
  function getDataPointsChartOption() {
    return {
      legend: {
        show: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      grid: {
        left: 50,
        right: 20,
        top: 20,
        bottom: 60,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
      },
      yAxis: {
        type: 'value',
      },
      dataZoom: [
        {
          type: 'slider',
          start: 80,
          end: 100,
          height: 20,
          bottom: 10,
        },
        {
          type: 'inside',
          start: 80,
          end: 100,
        },
      ],
      series: [
        {
          name: t('tb.gateway.storage.legends.attributes'),
          type: 'line',
          data: [],
          itemStyle: { color: '#52c41a' },
          barWidth: 10,
        },
        {
          name: t('tb.gateway.storage.legends.telemetry'),
          type: 'line',
          data: [],
          itemStyle: { color: '#faad14' },
          barWidth: 10,
        },
      ],
    };
  }

  //----------------  webSocket 订阅数据 ------------------

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const loading = ref(false);

  const cmdId = reactive({
    pushedDatapointCmdID: 0,
  });

  watch(
    () => props.timeParams,
    async () => {
      if (!props.timeParams) return;
      loading.value = true;
      fetchPushedDatapointSocket();
    },
    {
      immediate: true,
    },
  );

  // 监听 isActive 变化，当组件变为可见时重新调整图表尺寸
  watch(
    () => props.isActive,
    (newVal) => {
      if (newVal) {
        // 延迟执行以确保 DOM 已完成渲染
        nextTick(() => {
          setTimeout(() => {
            storageChart?.resize();
            platformChart?.resize();
            messageChart?.resize();
            dataPointsChart?.resize();
          }, 100);
        });
      }
    },
  );

  onUnmounted(() => {
    unsubscribeAll();
  });

  function unsubscribeAll() {
    unsubscribePushedDatapoint();
  }

  function unsubscribePushedDatapoint() {
    unsubscribe([cmdId.pushedDatapointCmdID], {
      cmds: [{ cmdId: cmdId.pushedDatapointCmdID, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
    });
  }

  /**
   * 订阅获取 统计信息的数据
   */
  async function fetchPushedDatapointSocket() {
    unsubscribePushedDatapoint();

    cmdId.pushedDatapointCmdID = getAndIncrementCmdId();
    send(
      [cmdId.pushedDatapointCmdID],
      {
        cmds: [
          {
            type: WsCmdType.ENTITY_DATA,
            query: {
              entityFilter: {
                type: EntityFilterType.SINGLE_ENTITY,
                singleEntity: {
                  id: props.gatewayId,
                  entityType: EntityType.DEVICE,
                },
              },
              pageLink: {
                pageSize: 1,
                page: 0,
                sortOrder: {
                  key: {
                    type: EntityKeyType.ENTITY_FIELD,
                    key: 'createdTime',
                  },
                  direction: 'DESC',
                },
              },
              entityFields: [
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'name',
                },
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'label',
                },
                {
                  type: EntityKeyType.ENTITY_FIELD,
                  key: 'additionalInfo',
                },
              ],
              latestValues: [
                {
                  type: EntityKeyType.TIME_SERIES,
                  key: 'serviceStats',
                },
                {
                  type: EntityKeyType.TIME_SERIES,
                  key: 'machineStats',
                },
              ],
            },
            cmdId: cmdId.pushedDatapointCmdID,
          },
        ],
      },
      () => {
        send(
          [cmdId.pushedDatapointCmdID],
          {
            cmds: [
              {
                type: WsCmdType.ENTITY_DATA,
                cmdId: cmdId.pushedDatapointCmdID,
                ...props.timeParams,
              },
            ],
          },
          onPushedDatapointMessage,
        );
      },
    );
  }

  /**
   * 订阅获取 设备在线的数据
   */
  function onPushedDatapointMessage(socketData: any) {
    loading.value = false;
    const data = socketData?.update?.[0];
    if (!data || !data.timeseries) {
      // 如果没有数据，重置所有数据为 0
      resetAllData();
      return;
    }
    // 处理 serviceStats 数据
    const serviceStats = data?.timeseries?.serviceStats || [];
    const machineStats = data?.timeseries?.machineStats || [];
    const latestServiceStats = data?.latest?.TIME_SERIES?.serviceStats;
    const latestMachineStats = data?.latest?.TIME_SERIES?.machineStats;

    if (serviceStats.length > 0 || machineStats.length > 0) {
      processServiceStatsData(serviceStats, machineStats);
    } else {
      resetAllData();
      return;
    }
    // 更新最新的统计值（从 latest 中获取）
    if (latestServiceStats?.value) {
      updateLatestStats(latestServiceStats.value, latestMachineStats?.value);
    }
  }

  /**
   * 处理 serviceStats 时间序列数据
   */
  function processServiceStatsData(serviceStats: any[], machineStats: any[]) {
    // 初始化数据数组
    const timestamps: string[] = [];
    const storageMsgPulledData: number[] = [];
    const platformMsgPushedData: number[] = [];
    const platformAttrProducedData: number[] = [];
    const platformTsProducedData: number[] = [];
    const msgsSentToPlatformData: number[] = [];
    const storageMsgCountData: number[] = [];
    const msgsReceivedFromPlatformData: number[] = [];

    // 反转数组，确保从旧到新的顺序
    const reversedStats = [...serviceStats].reverse();

    // 创建 machineStats 的时间戳映射，方便查找
    const machineStatsMap = new Map();
    if (machineStats && machineStats.length > 0) {
      machineStats.forEach((item) => {
        machineStatsMap.set(item.ts, item);
      });
    }
    // 遍历时间序列数据（从旧到新排序）
    reversedStats.forEach((item) => {
      try {
        const value = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        const timestamp = new Date(item.ts);

        // 格式化时间戳
        timestamps.push(`${timestamp.getMonth() + 1}/${timestamp.getDate()}`);

        // 提取各项数据，如果没有则默认为 0
        storageMsgPulledData.push(value.storageMsgPulled || 0);
        platformMsgPushedData.push(value.platformMsgPushed || 0);
        platformAttrProducedData.push(value.platformAttrProduced || 0);
        platformTsProducedData.push(value.platformTsProduced || 0);
        storageMsgCountData.push(value.storageMsgCount || 0);

        // 从 machineStats 中获取对应时间戳的数据
        const machineData = machineStatsMap.get(item.ts);
        if (machineData) {
          const machineValue =
            typeof machineData.value === 'string' ? JSON.parse(machineData.value) : machineData.value;
          msgsSentToPlatformData.push(machineValue.msgsSentToPlatform || 0);
          msgsReceivedFromPlatformData.push(machineValue.msgsReceivedFromPlatform || 0);
        } else {
          msgsSentToPlatformData.push(0);
          msgsReceivedFromPlatformData.push(0);
        }
      } catch (error) {
        console.error('解析 serviceStats 数据失败:', error);
      }
    });

    // 更新图表数据
    updateMessageChart(timestamps, storageMsgPulledData, platformMsgPushedData, msgsSentToPlatformData);
    updateDataPointsChart(timestamps, platformAttrProducedData, platformTsProducedData);
    updateStorageMiniChart(storageMsgCountData);
    updatePlatformMiniChart(msgsReceivedFromPlatformData);
  }

  /**
   * 更新最新的统计值
   */
  function updateLatestStats(valueStr: string, machineValueStr?: string) {
    try {
      const stats = typeof valueStr === 'string' ? JSON.parse(valueStr) : valueStr;

      // 更新存储消息数量
      storageMessageCount.value = stats.storageMsgCount || 0;

      // 更新消息统计
      messageStats.pulled = stats.storageMsgPulled || 0;
      messageStats.pushed = stats.platformMsgPushed || 0;

      // 从 machineStats 中获取发送到平台的消息数量和来自平台的消息数量
      if (machineValueStr) {
        const machineStats = typeof machineValueStr === 'string' ? JSON.parse(machineValueStr) : machineValueStr;
        messageStats.sent = machineStats.msgsSentToPlatform || 0;
        platformMessageCount.value = machineStats.msgsReceivedFromPlatform || 0;
      } else {
        messageStats.sent = 0;
        platformMessageCount.value = 0;
      }

      // 更新数据点
      dataPoints.attributes = stats.platformAttrProduced || 0;
      dataPoints.telemetry = stats.platformTsProduced || 0;
    } catch (error) {
      console.error('解析最新统计数据失败:', error);
    }
  }

  /**
   * 更新消息统计图表
   */
  function updateMessageChart(
    timestamps: string[],
    storageMsgPulled: number[],
    platformMsgPushed: number[],
    msgsSentToPlatform: number[],
  ) {
    if (!messageChart) return;

    messageChart.setOption({
      xAxis: {
        data: timestamps,
      },
      series: [
        {
          name: t('tb.gateway.storage.legends.storagePulled'),
          data: storageMsgPulled,
        },
        {
          name: t('tb.gateway.storage.legends.platformPushed'),
          data: platformMsgPushed,
        },
        {
          name: t('tb.gateway.storage.legends.platformSent'),
          data: msgsSentToPlatform,
        },
      ],
    });
  }

  /**
   * 更新数据点图表
   */
  function updateDataPointsChart(timestamps: string[], attributesData: number[], telemetryData: number[]) {
    if (!dataPointsChart) return;

    dataPointsChart.setOption({
      xAxis: {
        data: timestamps,
      },
      series: [
        {
          name: t('tb.gateway.storage.legends.attributes'),
          data: attributesData,
        },
        {
          name: t('tb.gateway.storage.legends.telemetry'),
          data: telemetryData,
        },
      ],
    });
  }

  /**
   * 更新存储消息数量小图表
   */
  function updateStorageMiniChart(data: number[]) {
    if (!storageChart) return;

    storageChart.setOption({
      xAxis: {
        data: Array(data.length).fill(''),
      },
      series: [
        {
          data: data,
        },
      ],
    });
  }

  /**
   * 更新来自平台的消息小图表
   */
  function updatePlatformMiniChart(data: number[]) {
    if (!platformChart) return;

    platformChart.setOption({
      xAxis: {
        data: Array(data.length).fill(''),
      },
      series: [
        {
          data: data,
        },
      ],
    });
  }

  /**
   * 重置所有数据为 0
   */
  function resetAllData() {
    storageMessageCount.value = 0;
    platformMessageCount.value = 0;
    messageStats.pulled = 0;
    messageStats.pushed = 0;
    messageStats.sent = 0;
    dataPoints.attributes = 0;
    dataPoints.telemetry = 0;

    // 重置图表为空数据
    const emptyTimestamps = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const emptyData = Array(30).fill(null);

    updateMessageChart(emptyTimestamps, emptyData, emptyData, emptyData);
    updateDataPointsChart(emptyTimestamps, emptyData, emptyData);
    updateStorageMiniChart(emptyData);
    updatePlatformMiniChart(emptyData);
  }
</script>

<style lang="less" scoped>
  .storage-statistics {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  // 第一行：左侧统计列 + 右侧图表列
  .first-row {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 12px;
    align-items: stretch;
  }

  // 左侧：统计卡片列
  .stats-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  // 右侧：图表列
  .chart-column {
    display: flex;
    flex-direction: column;
  }

  // 全宽行
  .full-width-row {
    width: 100%;
  }

  // 紧凑型统计卡片（左侧使用）
  .stat-card-compact {
    background: white;
    border-radius: 4px;
    padding: 16px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s;
    flex: 1;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card-header {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f0f0f0;

      .card-title {
        font-size: 14px;
        font-weight: 600;
        color: #262626;
      }
    }

    .card-content {
      .big-number {
        font-size: 28px;
        font-weight: 600;
        color: #262626;
        margin-bottom: 10px;
      }

      .mini-chart {
        height: 50px;
        width: 100%;
      }
    }
  }

  // 大卡片（图表卡片）
  .stat-card-large {
    background: white;
    border-radius: 4px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s;
    height: 100%;
    display: flex;
    flex-direction: column;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #262626;
      }

      .card-subtitle {
        font-size: 12px;
        color: #8c8c8c;
      }
    }

    .legend-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: #fafafa;
        border-radius: 4px;

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-label {
          font-size: 13px;
          color: #595959;
        }

        .legend-value {
          font-size: 14px;
          font-weight: 600;
          color: #262626;
          margin-left: 4px;
        }
      }
    }

    .card-content {
      flex: 1;
      display: flex;
      flex-direction: column;

      .main-chart {
        flex: 1;
        min-height: 260px;
        width: 100%;
      }
    }
  }

  // 全宽行中的大卡片（消息统计）
  .full-width-row .stat-card-large {
    height: auto;

    .card-header {
      flex-wrap: wrap;

      .legend-list {
        width: 100%;
        margin-top: 12px;
      }
    }

    .card-content {
      .main-chart {
        height: 320px;
        min-height: 320px;
        flex: none;
      }
    }
  }

  // 响应式设计
  @media (max-width: 1200px) {
    .first-row {
      grid-template-columns: 320px 1fr;
    }

    .stat-card-large .card-content .main-chart {
      height: 280px;
    }
  }

  @media (max-width: 968px) {
    .first-row {
      grid-template-columns: 1fr;
    }

    .stats-column {
      flex-direction: row;
      gap: 12px;

      .stat-card-compact {
        flex: 1;
      }
    }
  }

  @media (max-width: 768px) {
    .first-row {
      gap: 16px;
    }

    .stats-column {
      flex-direction: column;
    }

    .stat-card-compact {
      padding: 14px 16px;

      .card-content .mini-chart {
        height: 45px;
      }
    }

    .stat-card-large {
      padding: 16px;

      .card-content .main-chart {
        height: 240px;
      }
    }
  }
</style>
