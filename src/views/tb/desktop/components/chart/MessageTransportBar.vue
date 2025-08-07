<template>
  <div ref="chartRef" :style="{ height, width }"></div>
</template>
<script lang="ts" setup>
  import { computed, onMounted, onUnmounted, ref, Ref } from 'vue';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { isEmpty } from 'lodash-es';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import dayjs from 'dayjs';

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
  const timeseries = ref<Array<any>>([]);
  const TRANSPORT_MSG_COUNT_HOURLY_CMD_ID = ref(0);
  const chartRef = ref<HTMLDivElement | null>(null);
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);
  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();

  onMounted(() => {
    TRANSPORT_MSG_COUNT_HOURLY_CMD_ID.value = getAndIncrementCmdId();
    send(
      TRANSPORT_MSG_COUNT_HOURLY_CMD_ID.value,
      {
        cmds: [
          {
            cmdId: TRANSPORT_MSG_COUNT_HOURLY_CMD_ID.value,
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
        TRANSPORT_MSG_COUNT_HOURLY_CMD_ID.value,
        {
          cmds: [
            {
              cmdId: TRANSPORT_MSG_COUNT_HOURLY_CMD_ID.value,
              type: WsCmdType.ENTITY_DATA,
              historyCmd: {
                agg: 'SUM',
                interval: 86400000,
                limit: 30,
                keys: ['transportMsgCountHourly'],
                startTs: dayjs().subtract(30, 'day').startOf('D').valueOf(),
                endTs: dayjs().valueOf(),
              },
            },
          ],
        },
        onMessage,
      );
    } else {
      const arrayData = data.update[0].timeseries.transportMsgCountHourly || [];
      timeseries.value = arrayData.map((item) => ({
        ts: item.ts,
        value: Number.parseFloat(item.value),
      }));
      timeseries.value.sort((a, b) => a.ts - b.ts);
      renderChart();
    }
  }

  onUnmounted(() => {
    if (TRANSPORT_MSG_COUNT_HOURLY_CMD_ID.value > 0) {
      unsubscribe(TRANSPORT_MSG_COUNT_HOURLY_CMD_ID.value, {
        cmds: [
          {
            cmdId: TRANSPORT_MSG_COUNT_HOURLY_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE,
          },
        ],
      });
    }
  });

  function renderChart() {
    setOptions({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          lineStyle: {
            width: 1,
            color: '#019680',
          },
        },
        formatter: (arg: any) => {
          return `${dayjs(Number.parseInt(arg[0].name)).format('YYYY-MM-DD HH:mm:ss')}<br/>${arg[0].value}`;
        },
      },
      grid: { left: '1%', right: '1%', top: '2  %', bottom: 0, containLabel: true },
      xAxis: {
        type: 'category',
        data: timeseries.value.map((item) => item.ts) || [],
        axisLabel: {
          formatter: (value) => dayjs(Number.parseInt(value)).format(timeFormat.value),
        },
      },
      yAxis: {
        type: 'value',
        splitNumber: 4,
        axisLabel: {
          formatter: (value) => value / 1000 + 'k',
        },
      },
      series: [
        {
          data: timeseries.value.map((item) => item.value) || [],
          type: 'bar',
          barMaxWidth: 80,
        },
      ],
    });
  }

  const timeFormat = computed(() => {
    if (timeseries.value.length > 2) {
      const diff = Math.abs(timeseries.value[0].ts - timeseries.value[timeseries.value.length - 1].ts);
      if (diff < 3600 * 1000 * 24) {
        return 'HH:mm';
      }
      if (diff < 3600 * 1000 * 24 * 30) {
        return 'MM-DD HH时';
      }
      return 'MM月DD日';
    }
    return 'HH:mm';
  });
</script>
