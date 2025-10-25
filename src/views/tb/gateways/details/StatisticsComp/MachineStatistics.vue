<template>
  <div class="machine-statistics">
    <!-- 顶部：三个资源卡片 -->
    <div class="resource-cards">
      <!-- CPU 卡片 -->
      <div class="resource-card">
        <div class="card-header">
          <div class="icon-wrapper cpu-icon">
            <Icon icon="ant-design:cloud-server-outlined" :size="24" />
          </div>
          <div class="status-badge success">
            <CheckCircleOutlined />
          </div>
        </div>
        <div class="card-body">
          <div class="label">{{ t('tb.gateway.machine.cpu') }}</div>
          <div class="stats-row">
            <div class="value-wrapper">
              <span class="value">{{ cpuUsage }}</span>
              <span class="unit">%</span>
            </div>
            <div class="meta">{{ cpuCores }} {{ t('tb.gateway.machine.coresSuffix') }}</div>
          </div>
        </div>
      </div>

      <!-- 内存卡片 -->
      <div class="resource-card">
        <div class="card-header">
          <div class="icon-wrapper memory-icon">
            <Icon icon="ant-design:database-outlined" :size="24" />
          </div>
          <div class="status-badge success">
            <CheckCircleOutlined />
          </div>
        </div>
        <div class="card-body">
          <div class="label">{{ t('tb.gateway.machine.memory') }}</div>
          <div class="stats-row">
            <div class="value-wrapper">
              <span class="value">{{ memoryUsage }}</span>
              <span class="unit">%</span>
            </div>
            <div class="meta">{{ memoryUsed }}GB / {{ memoryTotal }}GB</div>
          </div>
        </div>
      </div>

      <!-- 磁盘卡片 -->
      <div class="resource-card">
        <div class="card-header">
          <div class="icon-wrapper disk-icon">
            <Icon icon="ant-design:hdd-outlined" :size="24" />
          </div>
          <div class="status-badge success">
            <CheckCircleOutlined />
          </div>
        </div>
        <div class="card-body">
          <div class="label">{{ t('tb.gateway.machine.disk') }}</div>
          <div class="stats-row">
            <div class="value-wrapper">
              <span class="value">{{ diskUsage }}</span>
              <span class="unit">%</span>
            </div>
            <div class="meta">{{ diskFree }}GB {{ t('tb.gateway.machine.diskFreeSuffix') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 资源趋势图表 -->
    <div class="resource-trend-card">
      <div class="card-header">
        <div class="header-left">
          <span class="card-title">{{ t('tb.gateway.machine.cardTitle') }}</span>
        </div>
      </div>
      <div class="card-content">
        <div class="legend-list">
          <div class="legend-item">
            <span class="legend-dot cpu-color"></span>
            <span class="legend-label">{{ t('tb.gateway.machine.series.cpuUsage') }}</span>
            <span class="legend-value">{{ latestValues.cpu }}%</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot memory-color"></span>
            <span class="legend-label">{{ t('tb.gateway.machine.series.memoryUsage') }}</span>
            <span class="legend-value">{{ latestValues.memory }}%</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot disk-color"></span>
            <span class="legend-label">{{ t('tb.gateway.machine.series.diskFree') }}</span>
            <span class="legend-value">{{ latestValues.disk }}GB</span>
          </div>
        </div>
        <div class="main-chart" ref="trendChartRef"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup name="MachineStatistics">
  import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
  import { CheckCircleOutlined } from '@ant-design/icons-vue';
  import * as echarts from 'echarts';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  const { t } = useI18n('tb');
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { EntityFilterType, EntityKeyType } from '/@/enums/queryEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { findEntityDataByQuery } from '/@/api/tb/entityQuery';

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
  const trendChartRef = ref<HTMLElement>();

  // 图表实例
  let trendChart: echarts.ECharts | null = null;

  // 资源数据
  const cpuUsage = ref('0');
  const cpuCores = ref('1');
  const memoryUsage = ref('0');
  const memoryUsed = ref('0');
  const memoryTotal = ref('0');
  const diskUsage = ref('0');
  const diskFree = ref('0');

  // 最新值
  const latestValues = reactive({
    cpu: '0',
    memory: '0',
    disk: '0',
  });

  // 时序数据
  const timeSeriesData = reactive({
    timestamps: [] as string[],
    cpu: [] as number[],
    memory: [] as number[],
    disk: [] as number[],
  });

  onMounted(() => {
    nextTick(() => {
      initCharts();
      // 图表初始化后，设置默认空数据
      resetAllData();
    });
  });

  onUnmounted(() => {
    disposeCharts();
    unsubscribeAll();
  });

  function initCharts() {
    // 销毁已存在的图表
    trendChart?.dispose();

    // 初始化主图表
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value);
    }

    // 响应式调整
    window.removeEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
  }

  function disposeCharts() {
    window.removeEventListener('resize', handleResize);
    trendChart?.dispose();
  }

  function handleResize() {
    trendChart?.resize();
  }

  function updateTrendChart() {
    if (!trendChart) return;

    const series: any[] = [
      {
        name: t('tb.gateway.machine.series.cpuUsage'),
        type: 'line',
        smooth: true,
        data: timeSeriesData.cpu,
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 2 },
        showSymbol: false,
        yAxisIndex: 0,
      },
      {
        name: t('tb.gateway.machine.series.memoryUsage'),
        type: 'line',
        smooth: true,
        data: timeSeriesData.memory,
        itemStyle: { color: '#faad14' },
        lineStyle: { width: 2 },
        showSymbol: false,
        yAxisIndex: 0,
      },
      {
        name: t('tb.gateway.machine.series.diskFree'),
        type: 'line',
        smooth: true,
        data: timeSeriesData.disk,
        itemStyle: { color: '#1890ff' },
        lineStyle: { width: 2 },
        showSymbol: false,
        yAxisIndex: 1,
      },
    ];

    trendChart.setOption(
      {
        legend: {
          show: false,
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985',
            },
          },
          formatter: (params: any) => {
            let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
            params.forEach((item: any) => {
              const unit = item.seriesName.includes('磁盘') ? 'GB' : '%';
              result += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
                <span style="flex: 1;">${item.seriesName}:</span>
                <span style="font-weight: 600; margin-left: 12px;">${item.value.toFixed(2)}${unit}</span>
              </div>`;
            });
            return result;
          },
        },
        grid: {
          left: 60,
          right: 80,
          top: 30,
          bottom: 60,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: timeSeriesData.timestamps,
          axisLabel: {
            formatter: (value: string) => {
              return value;
            },
          },
        },
        yAxis: [
          {
            type: 'value',
            name: t('tb.gateway.machine.yAxis.usage'),
            position: 'left',
            axisLabel: {
              formatter: '{value}%',
            },
          },
          {
            type: 'value',
            name: t('tb.gateway.machine.yAxis.disk'),
            position: 'right',
            axisLabel: {
              formatter: '{value}GB',
            },
          },
        ],
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
        series,
      },
      { replaceMerge: ['series'] },
    );
  }

  //----------------  webSocket 订阅数据 ------------------

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  const loading = ref(false);

  const cmdId = reactive({
    machineStatsCmdID: 0,
  });

  watch(
    () => props.timeParams,
    async () => {
      if (!props.timeParams) return;
      loading.value = true;
      fetchMachineStatsSocket();
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
            trendChart?.resize();
          }, 100);
        });
      }
    },
  );

  onMounted(async () => {
    const res = await findEntityDataByQuery({
      entityFilter: {
        type: EntityFilterType.SINGLE_ENTITY,
        singleEntity: {
          id: props.gatewayId,
          entityType: EntityType.DEVICE,
        },
      },
      pageLink: {
        page: 0,
        pageSize: 1024,
        textSearch: null,
        dynamic: true,
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
          type: EntityKeyType.ATTRIBUTE,
          key: 'totalMemory',
        },
        {
          type: EntityKeyType.ATTRIBUTE,
          key: 'totalDisk',
        },
        {
          type: EntityKeyType.TIME_SERIES,
          key: 'machineStats',
        },
        {
          type: EntityKeyType.TIME_SERIES,
          key: 'machineStats',
        },
        {
          type: EntityKeyType.TIME_SERIES,
          key: 'machineStats',
        },
      ],
    });
    if (!res.data.length) {
      return;
    }

    const totalMemory = res.data[0]?.latest?.[EntityKeyType.ATTRIBUTE]?.totalMemory;
    const totalDisk = res.data[0]?.latest?.[EntityKeyType.ATTRIBUTE]?.totalDisk;

    memoryTotal.value = totalMemory.value ?? 0;
    diskFree.value = totalDisk.value ?? 0;
  });

  function unsubscribeAll() {
    unsubscribeMachineStats();
  }

  function unsubscribeMachineStats() {
    if (cmdId.machineStatsCmdID === 0) return;
    unsubscribe([cmdId.machineStatsCmdID], {
      cmds: [{ cmdId: cmdId.machineStatsCmdID, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
    });
  }

  /**
   * 订阅获取机器统计信息的数据
   */
  async function fetchMachineStatsSocket() {
    unsubscribeMachineStats();

    cmdId.machineStatsCmdID = getAndIncrementCmdId();
    send(
      [cmdId.machineStatsCmdID],
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
              ],
              latestValues: [
                {
                  type: EntityKeyType.TIME_SERIES,
                  key: 'machineStats',
                },
              ],
            },
            cmdId: cmdId.machineStatsCmdID,
          },
        ],
      },
      () => {
        send(
          [cmdId.machineStatsCmdID],
          {
            cmds: [
              {
                type: WsCmdType.ENTITY_DATA,
                cmdId: cmdId.machineStatsCmdID,
                ...props.timeParams,
              },
            ],
          },
          onMachineStatsMessage,
        );
      },
    );
  }

  /**
   * 处理机器统计数据的回调
   */
  function onMachineStatsMessage(socketData: any) {
    loading.value = false;
    const data = socketData?.update?.[0];
    if (!data) {
      resetAllData();
      return;
    }

    // 处理 machineStats 数据
    const machineStats = data?.timeseries?.machineStats || [];
    const latestMachineStats = data?.latest?.TIME_SERIES?.machineStats;

    if (machineStats.length > 0) {
      processMachineStatsData(machineStats);
    } else {
      resetAllData();
    }

    // 更新最新的统计值（从 latest 中获取）
    if (latestMachineStats?.value) {
      updateLatestMachineStats(latestMachineStats.value);
    }
  }

  /**
   * 处理 machineStats 时间序列数据
   */
  function processMachineStatsData(machineStats: any[]) {
    // 清空现有数据
    timeSeriesData.timestamps = [];
    timeSeriesData.cpu = [];
    timeSeriesData.memory = [];
    timeSeriesData.disk = [];

    // 反转数组，确保从旧到新的顺序
    const reversedStats = [...machineStats].reverse();

    // 遍历时间序列数据
    reversedStats.forEach((item) => {
      try {
        const value = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        const timestamp = new Date(item.ts);

        // 格式化时间戳
        const timeStr = `${timestamp.getMonth() + 1}/${timestamp.getDate()} ${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
        timeSeriesData.timestamps.push(timeStr);

        // 提取各项数据，如果没有则默认为 0
        timeSeriesData.cpu.push(value.gwProcessCpuUsage || 0);
        timeSeriesData.memory.push(value.gwMemory || 0);
        // freeDisk 可能是字符串格式如 "952.3G"，需要解析
        const diskValue = parseDiskValue(value.freeDisk);
        timeSeriesData.disk.push(diskValue);
      } catch (error) {
        console.error('解析 machineStats 数据失败:', error);
      }
    });

    // 更新图表
    updateTrendChart();
  }

  /**
   * 解析磁盘空间值（如 "952.3G" -> 952.3）
   */
  function parseDiskValue(diskStr: string | number): number {
    if (typeof diskStr === 'number') return diskStr;
    if (!diskStr) return 0;

    const match = diskStr.match(/([0-9.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * 更新最新的机器统计值
   */
  function updateLatestMachineStats(valueStr: string) {
    try {
      const stats = typeof valueStr === 'string' ? JSON.parse(valueStr) : valueStr;

      // 更新 CPU 使用率
      cpuUsage.value = (stats.gwProcessCpuUsage || 0).toFixed(1);
      latestValues.cpu = cpuUsage.value;

      // 更新内存使用率
      memoryUsage.value = (stats.gwMemory || 0).toFixed(1);
      latestValues.memory = memoryUsage.value;

      // 更新磁盘使用率
      diskUsage.value = (stats.diskUsage || 0).toFixed(1);

      // 更新可用磁盘空间
      const freeDiskValue = parseDiskValue(stats.freeDisk);
      diskFree.value = freeDiskValue.toFixed(2);
      latestValues.disk = diskFree.value;

      // 更新空闲内存
      memoryUsed.value = (stats.freeMemory || 0).toFixed(2);
    } catch (error) {
      console.error('解析最新机器统计数据失败:', error);
    }
  }

  /**
   * 重置所有数据为 0
   */
  function resetAllData() {
    cpuUsage.value = '0';
    memoryUsage.value = '0';
    diskUsage.value = '0';
    memoryUsed.value = '0';

    latestValues.cpu = '0';
    latestValues.memory = '0';
    latestValues.disk = '0';

    // 生成空的时间序列数据（30个数据点）
    const emptyTimestamps = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
    });
    const emptyData = Array(30).fill(null);

    timeSeriesData.timestamps = emptyTimestamps;
    timeSeriesData.cpu = [...emptyData];
    timeSeriesData.memory = [...emptyData];
    timeSeriesData.disk = [...emptyData];

    // 更新图表
    updateTrendChart();
  }
</script>

<style lang="less" scoped>
  .machine-statistics {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  // 资源卡片容器
  .resource-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  // 单个资源卡片
  .resource-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #52c41a, #73d13d);
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

      &::before {
        opacity: 1;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: transform 0.3s;

        &.cpu-icon {
          background: linear-gradient(135deg, #52c41a, #73d13d);
        }

        &.memory-icon {
          background: linear-gradient(135deg, #faad14, #ffc53d);
        }

        &.disk-icon {
          background: linear-gradient(135deg, #1890ff, #40a9ff);
        }
      }

      .status-badge {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;

        &.success {
          background: #f6ffed;
          color: #52c41a;
        }
      }
    }

    .card-body {
      .label {
        font-size: 14px;
        color: #8c8c8c;
        margin-bottom: 12px;
        font-weight: 500;
      }

      .stats-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;

        .value-wrapper {
          display: flex;
          align-items: baseline;

          .value {
            font-size: 36px;
            font-weight: 600;
            color: #262626;
            line-height: 1;
            font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
          }

          .unit {
            font-size: 18px;
            color: #8c8c8c;
            margin-left: 4px;
            font-weight: 500;
          }
        }

        .meta {
          font-size: 14px;
          color: #595959;
          white-space: nowrap;
          font-weight: 500;
        }
      }
    }
  }

  // 趋势图表卡片
  .resource-trend-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #262626;
        }

        .card-subtitle {
          font-size: 13px;
          color: #8c8c8c;
          padding: 4px 12px;
          background: #fafafa;
          border-radius: 12px;
        }
      }

      .header-right {
        display: flex;
        gap: 12px;
        align-items: center;

        .ml-2 {
          margin-left: 8px;
        }
      }
    }

    .card-content {
      .legend-list {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 20px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: #fafafa;
          border-radius: 8px;

          .legend-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;

            &.cpu-color {
              background: #52c41a;
            }

            &.memory-color {
              background: #faad14;
            }

            &.disk-color {
              background: #1890ff;
            }
          }

          .legend-label {
            font-size: 14px;
            color: #595959;
          }

          .legend-value {
            font-size: 14px;
            font-weight: 600;
            color: #262626;
            margin-left: 8px;
            font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
          }
        }
      }

      .main-chart {
        width: 100%;
        height: 420px;
      }
    }
  }

  // 响应式设计
  @media (max-width: 1400px) {
    .resource-cards {
      grid-template-columns: repeat(3, 1fr);
    }

    .resource-trend-card .card-content .main-chart {
      height: 380px;
    }
  }

  @media (max-width: 968px) {
    .resource-cards {
      grid-template-columns: 1fr;
    }

    .resource-trend-card {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        .header-right {
          width: 100%;
          justify-content: space-between;
        }
      }

      .card-content .main-chart {
        height: 320px;
      }
    }
  }

  @media (max-width: 768px) {
    .machine-statistics {
      gap: 12px;
    }

    .resource-card {
      padding: 16px;

      .card-header .icon-wrapper {
        width: 40px;
        height: 40px;
      }

      .card-body .stats-row .value-wrapper .value {
        font-size: 28px;
      }
    }

    .resource-trend-card {
      padding: 16px;

      .card-content .main-chart {
        height: 280px;
      }
    }
  }
</style>
