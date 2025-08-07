<template>
  <div ref="chartRef" :style="{ height, width }"></div>
</template>
<script lang="ts" setup>
  import { onMounted, onUnmounted, ref, Ref } from 'vue';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { isEmpty } from 'lodash-es';
  import dayjs from 'dayjs';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';

  defineProps({
    width: {
      type: String as PropType<string>,
      default: '100%',
    },
    height: {
      type: String as PropType<string>,
      default: '280px',
    },
  });

  const cpuSeries = ref<Array<any>>([]);
  const discSeries = ref<Array<any>>([]);
  const memorySeries = ref<Array<any>>([]);
  const CPU_USAGE_CMD_ID = ref(0);
  const chartRef = ref<HTMLDivElement | null>(null);
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);
  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  onMounted(() => {
    CPU_USAGE_CMD_ID.value = getAndIncrementCmdId();
    send(
      CPU_USAGE_CMD_ID.value,
      {
        cmds: [
          {
            cmdId: CPU_USAGE_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            query: {
              entityFilter: { resolveMultiple: true, type: 'apiUsageState' },
              entityFields: [
                { type: 'ENTITY_FIELD', key: 'name' },
                { type: 'ENTITY_FIELD', key: 'label' },
                { type: 'ENTITY_FIELD', key: 'additionalInfo' },
              ],
              pageLink: {
                page: 0,
                pageSize: 1024,
                sortOrder: { direction: 'DESC', key: { type: 'ENTITY_FIELD', key: 'createdTime' } },
              },
            },
          },
        ],
      },
      onMessage,
    );
  });

  function onMessage(data: any) {
    if (isEmpty(data.update)) {
      send(
        CPU_USAGE_CMD_ID.value,
        {
          cmds: [
            {
              cmdId: CPU_USAGE_CMD_ID.value,
              type: WsCmdType.ENTITY_DATA,
              tsCmd: {
                keys: ['cpuUsage', 'memoryUsage', 'discUsage'],
                agg: 'AVG',
                interval: 10000,
                limit: 361,
                startTs: dayjs().subtract(1, 'hours').valueOf(),
                timeWindow: 3610000,
              },
            },
          ],
        },
        onMessage,
      );
    } else {
      const cpuUsageData = data.update[0].timeseries.cpuUsage || [];
      const discUsageData = data.update[0].timeseries.discUsage || [];
      const memoryUsage = data.update[0].timeseries.memoryUsage || [];

      if (cpuUsageData.length > 1) {
        cpuSeries.value = cpuUsageData.map((item) => ({
          ts: item.ts,
          value: Number.parseFloat(item.value),
        }));
        cpuSeries.value.sort((a, b) => a.ts - b.ts);
      } else if (cpuUsageData.length == 1) {
        cpuSeries.value.push({
          ts: cpuUsageData[0].ts,
          value: Number.parseFloat(cpuUsageData[0].value),
        });
        cpuSeries.value.shift();
      }
      if (discUsageData.length > 1) {
        discSeries.value = discUsageData.map((item) => ({
          ts: item.ts,
          value: Number.parseFloat(item.value),
        }));
        discSeries.value.sort((a, b) => a.ts - b.ts);
      } else if (discUsageData.length == 1) {
        discSeries.value.push({
          ts: discUsageData[0].ts,
          value: Number.parseFloat(discUsageData[0].value),
        });
        discSeries.value.shift();
      }
      if (memoryUsage.length > 1) {
        memorySeries.value = memoryUsage.map((item) => ({
          ts: item.ts,
          value: Number.parseFloat(item.value),
        }));
        memorySeries.value.sort((a, b) => a.ts - b.ts);
      } else if (memoryUsage.length == 1) {
        memorySeries.value.push({
          ts: memoryUsage[0].ts,
          value: Number.parseFloat(memoryUsage[0].value),
        });
        memorySeries.value.shift();
      }

      renderChart();
    }
  }

  onUnmounted(() => {
    if (CPU_USAGE_CMD_ID.value > 0) {
      unsubscribe(CPU_USAGE_CMD_ID.value, {
        cmds: [{ cmdId: CPU_USAGE_CMD_ID.value, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  });

  function renderChart() {
    setOptions({
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => value + '%',

        formatter: (arg: Array<any>) => {
          const name = dayjs(Number.parseInt(arg[0].name)).format('YYYY-MM-DD HH:mm:ss');
          const value = arg
            .map(
              (item) =>
                `<div style="display:flex;justify-content:space-between"><span>${item.marker}${item.seriesName}</span><span>${item.value}%</span></div>`,
            )
            .join('');
          return `${name}</br>${value} `;
        },
      },
      legend: {
        data: ['CPU', '内存', '硬盘'],
        icon: 'roundRect',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: cpuSeries.value.map((item) => item.ts) || [],
        splitLine: {
          show: true,
          lineStyle: {
            width: 1,
            type: 'solid',
            color: 'rgba(226,226,226,0.5)',
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          formatter: (value) => dayjs(Number.parseInt(value)).format('HH:mm'),
        },
      },
      yAxis: [
        {
          type: 'value',
          splitNumber: 4,
          axisTick: {
            show: false,
          },
          splitArea: {
            show: true,
            areaStyle: {
              color: ['rgba(255,255,255,0.2)', 'rgba(226,226,226,0.2)'],
            },
          },
          axisLabel: {
            formatter: (value) => value + '%',
          },
        },
      ],
      grid: { left: '1%', right: '1%', top: '10%', bottom: 0, containLabel: true },
      series: [
        {
          name: 'CPU',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: cpuSeries.value.map((item) => item.value) || [],
        },
        {
          name: '内存',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: memorySeries.value.map((item) => item.value) || [],
        },
        {
          name: '硬盘',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: discSeries.value.map((item) => item.value) || [],
        },
      ],
    });
  }
</script>
