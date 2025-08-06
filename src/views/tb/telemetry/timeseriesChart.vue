<template>
  <div class="timeseries-chart">
    <Card size="small">
      <template #title>
        <span class="font-bold">
          <template v-if="property?.name"> {{ property.name }} ({{ kvEntity.key }}) </template>
          <template v-else>{{ kvEntity.key }} </template>
          {{ property?.dataType?.specs?.unit }}
        </span>
      </template>
      <template #extra>
        <Space>
          <Tooltip title="全屏">
            <Icon icon="ant-design:fullscreen-outlined" :size="18" class="cursor-pointer" @click="handleOpenModal" />
          </Tooltip>
          <Popover v-model:open="filterPopoverVisible" trigger="click" placement="bottom">
            <template #title> 数据过滤 </template>
            <template #content>
              <div style="width: 360px">
                <BasicForm @register="registerForm" />
                <div class="w-full flex">
                  <div class="flex-1"> </div>
                  <Space>
                    <a-button @click="filterPopoverVisible = false">取消</a-button>
                    <a-button type="primary" @click="subscribeHistoryData()">更新</a-button>
                  </Space>
                </div>
              </div>
            </template>

            <Tooltip title="数据过滤">
              <Icon icon="ant-design:clock-circle-outlined" :size="18" class="cursor-pointer" />
            </Tooltip>
          </Popover>
        </Space>
      </template>
      <div>
        <div ref="chartRef" :style="{ width, height }" v-if="showChart"> </div>
        <BasicTable
          :columns="tableColumns"
          :dataSource="series"
          :pagination="false"
          size="small"
          :bordered="false"
          :scroll="{ y: 200 }"
          :showIndexColumn="false"
          v-if="!showChart"
        />
      </div>
    </Card>
    <TimeseriesModal @register="registerModal" />
  </div>
</template>
<script lang="ts" setup name="TimeseriesChart">
  import { ref, onMounted, onUnmounted, Ref, reactive, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Card, Popover, Tooltip, Space } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import dayjs from 'dayjs';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { useModal } from '/@/components/Modal';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { TsData, TsKvEntity } from '/@/api/tb/telemetry';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import TimeseriesModal from './timeseriesModal.vue';
  import { isArray } from 'lodash-es';
  import { AGGREGATION_OPTIONS, Aggregation } from '/@/enums/telemetryEnum';
  import { getTimeseries, TelemetryQuery } from '/@/api/tb/telemetry';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { BasicColumn, BasicTable } from '/@/components/Table';
  import { EntityType } from '/@/enums/entityTypeEnum';

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  const props = defineProps({
    entityType: {
      type: String as PropType<EntityType>,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    kvEntity: {
      type: Object as PropType<Recordable>,
      required: true,
    },
    width: {
      type: String as PropType<string>,
      default: '100%',
    },
    height: {
      type: String as PropType<string>,
      default: '200px',
    },
  });

  const LATEST_CMD_ID = ref(0);
  const filterPopoverVisible = ref(false);
  const chartRef = ref<HTMLDivElement | null>(null);
  const loading = ref(false);
  const series = ref<Array<TsData>>([]);

  const property = ref<Function>(props.kvEntity.property);
  const keyStr = computed(() => props.kvEntity.key);

  const { getAndIncrementCmdId, send: websocketSend, unsubscribe: websocketUnsubscribe } = useWebsocketStore();

  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);

  const rangePresets = ref([
    { label: '今天', value: [dayjs().startOf('D'), dayjs()] },
    { label: '最近1小时', value: [dayjs().subtract(1, 'hour'), dayjs()] },
    { label: '最近6小时', value: [dayjs().subtract(6, 'hour'), dayjs()] },
    { label: '最近1天', value: [dayjs().subtract(1, 'day').startOf('D'), dayjs()] },
    { label: '最近3天', value: [dayjs().subtract(2, 'day').startOf('D'), dayjs()] },
    { label: '最近7天', value: [dayjs().subtract(6, 'day').startOf('D'), dayjs()] },
  ]);

  const inputFormSchemas: FormSchema[] = [
    { field: 'entityType', component: 'Input', defaultValue: props.entityType, show: false },
    { field: 'entityId', component: 'Input', defaultValue: props.entityId, show: false },
    { field: 'keys', component: 'Input', defaultValue: keyStr.value, show: false },
    { field: 'orderBy', component: 'Input', defaultValue: 'ASC', show: false },
    {
      label: t('时间间隔'),
      field: 'timeRange',
      component: 'RangePicker',
      defaultValue: [dayjs().subtract(2, 'hour'), dayjs()],
      componentProps: {
        presets: rangePresets,
        showTime: true,
        allowClear: false,
      },
    },
    {
      label: t('间隔时间'),
      field: 'interval',
      component: 'Select',
      defaultValue: 60000,
      componentProps: {
        options: [
          { label: '1秒钟', value: 1000 },
          { label: '1分钟', value: 60000 },
          { label: '5分钟', value: 300000 },
          { label: '10分钟', value: 600000 },
          { label: '30分钟', value: 1800000 },
          { label: '1小时', value: 3600000 },
          { label: '2小时', value: 7800000 },
          { label: '6小时', value: 21600000 },
          { label: '12小时', value: 43200000 },
          { label: '1天', value: 86400000 },
          { label: '7天', value: 604800000 },
          { label: '15天', value: 1296000000 },
          { label: '30天', value: 25920000000 },
        ],
      },
    },
    {
      label: t('数据数量'),
      field: 'limit',
      defaultValue: 1000,
      component: 'InputNumber',
      componentProps: {
        min: 100,
      },
    },
    {
      label: t('聚合函数'),
      field: 'agg',
      component: 'Select',
      defaultValue: Aggregation.NONE,
      componentProps: {
        options: AGGREGATION_OPTIONS,
      },
    },
  ];

  const tableColumns: BasicColumn[] = [
    {
      title: '时间',
      dataIndex: 'ts',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      width: 150,
    },
    {
      title: '数值',
      dataIndex: 'value',
    },
  ];
  const showChart = computed(() => {
    // if (
    //   property.value &&
    //   property.value.dataType &&
    //   (property.value.dataType.type == DataType.int ||
    //     property.value.dataType.type == DataType.float ||
    //     property.value.dataType.type == DataType.double)
    // ) {
    //   return true;
    // }
    return false;
  });
  const [registerModal, { openModal }] = useModal();
  const [registerForm, { validate }] = useForm({
    labelWidth: 80,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  const query = reactive({
    entityType: props.entityType,
    entityId: props.entityId,
    keys: props.kvEntity.key,
    timeRange: [dayjs().subtract(2, 'hour'), dayjs()],
    interval: 100,
    limit: 100,
    agg: 'NONE',
    orderBy: 'ASC',
    useStrictDataTypes: false,
  });

  async function fetchTimeseries(init: boolean) {
    try {
      let result = {} as TsKvEntity;
      if (init == true) {
        loading.value = true;
        result = await getTimeseries({
          ...query,
          startTs: query.timeRange[0].valueOf(),
          endTs: query.timeRange[1].valueOf(),
          timeRange: null,
        } as TelemetryQuery);
      } else {
        const data = await validate();
        loading.value = true;
        filterPopoverVisible.value = false;
        result = await getTimeseries({
          ...data,
          startTs: dayjs(data.timeRange[0]).valueOf(),
          endTs: dayjs(data.timeRange[1]).valueOf(),
          timeRange: null,
        } as TelemetryQuery);
      }

      property.value = result[keyStr.value].property || ({} as Function);

      series.value = result[keyStr.value].data || [];
      renderChart();
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      loading.value = false;
    }
  }

  function sendInitQuery() {
    websocketSend(
      LATEST_CMD_ID.value,
      {
        cmds: [
          {
            cmdId: LATEST_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            query: {
              entityFilter: {
                type: 'singleEntity',
                singleEntity: { entityType: props.entityType, id: props.entityId },
              },
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
      onWebsocketMessage,
    );
  }

  async function subscribeTsData() {
    let data: any = {};

    try {
      data = await validate();
    } catch (error: any) {
      console.log(error);
    }

    const queryData = {
      timeRange: [dayjs().subtract(2, 'hour'), dayjs()],
      interval: 60000,
      limit: 1000,
      agg: Aggregation.NONE,
      ...data,
    };
    websocketSend(
      LATEST_CMD_ID.value,
      {
        cmds: [
          {
            cmdId: LATEST_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            tsCmd: {
              agg: queryData.agg,
              interval: queryData.interval,
              intervalType: 'MILLISECONDS',
              keys: [keyStr.value],
              limit: queryData.limit,
              startTs: dayjs(queryData.timeRange[0]).valueOf(),
              timeWindow: 60000,
              timeZoneId: 'Asia/Shanghai',
            },
          },
        ],
      },
      onWebsocketMessage,
    );
  }

  async function subscribeHistoryData() {
    let data: any = {};

    try {
      data = await validate();
    } catch (error: any) {
      console.log(error);
    }

    const queryData = {
      timeRange: [dayjs().subtract(2, 'hour'), dayjs()],
      interval: 60000,
      limit: 1000,
      agg: Aggregation.NONE,
      ...data,
    };
    websocketSend(
      LATEST_CMD_ID.value,
      {
        cmds: [
          {
            cmdId: LATEST_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            historyCmd: {
              agg: queryData.agg,
              interval: queryData.interval,
              intervalType: 'MILLISECONDS',
              keys: [keyStr.value],
              limit: queryData.limit,
              startTs: dayjs(queryData.timeRange[0]).valueOf(),
              endTs: dayjs(queryData.timeRange[1]).valueOf(),
              timeZoneId: 'Asia/Shanghai',
            },
          },
        ],
      },
      onWebsocketMessage,
    );
  }

  function onWebsocketMessage(data: any) {
    if (data.update && isArray(data.update)) {
      const arrayData = data.update[0].timeseries[keyStr.value] || [];
      series.value = arrayData.map((item) => ({
        ts: item.ts,
        value: item.value,
      }));
      series.value.sort((a, b) => a.ts - b.ts);
      renderChart();
    } else {
      subscribeHistoryData();
    }
  }

  function renderChart() {
    if (!showChart) {
      return;
    }
    setOptions({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          lineStyle: { width: 1, color: '#019680' },
        },
        formatter: (arg: any) => {
          if (property.value?.dataType?.specs?.unit) {
            return `${dayjs(Number.parseInt(arg[0].name)).format('YYYY-MM-DD HH:mm:ss')}<br/>${arg[0].value}(${property.value?.dataType?.specs?.unit})`;
          }
          return `${dayjs(Number.parseInt(arg[0].name)).format('YYYY-MM-DD HH:mm:ss')}<br/>${arg[0].value}`;
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: series.value.map((item) => item.ts) || [],
        splitLine: {
          show: true,
          lineStyle: { width: 1, type: 'solid', color: 'rgba(226,226,226,0.5)' },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          formatter: (value) => dayjs(Number.parseInt(value)).format(timeFormat.value),
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
        },
      ],
      grid: { left: '1%', right: '1%', top: '2  %', bottom: 0, containLabel: true },
      series: [
        {
          smooth: true,
          data: series.value.map((item) => item.value) || [],
          type: 'line',
          areaStyle: {},
          itemStyle: { color: '#5ab1ef' },
        },
      ],
    });
  }

  onMounted(async () => {
    LATEST_CMD_ID.value = getAndIncrementCmdId();
    // await fetchTimeseries(true);
    sendInitQuery();
  });

  onUnmounted(() => {
    if (LATEST_CMD_ID.value > 0) {
      websocketUnsubscribe(LATEST_CMD_ID.value, {
        cmdId: LATEST_CMD_ID.value,
        type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE,
      });
    }
  });

  const timeFormat = computed(() => {
    if (series.value.length > 2) {
      const diff = Math.abs(series.value[0].ts - series.value[series.value.length - 1].ts);
      if (diff < 3600 * 1000 * 24) {
        return 'HH:mm';
      }
      if (diff < 3600 * 1000 * 24 * 30) {
        return 'MM-DD HH';
      }
      return 'YY-MM-DD';
    }
    return 'HH:mm';
  });

  function handleOpenModal() {
    openModal(true, {
      entityType: props.entityType,
      entityId: props.entityId,
      keys: keyStr.value,
      // property: props.kvEntity.property,
    });
  }
</script>

<style lang="less">
  .timeseries-chart {
  }
</style>
