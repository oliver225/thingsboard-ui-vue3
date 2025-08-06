<template>
  <BasicModal
    v-bind="$attrs"
    :footer="false"
    @register="registerModal"
    width="60%"
    @height-change="(height) => (modalHeight = height)"
    @cancel="handleClose"
  >
    <template #title>
      <span class="font-bold">
        <template v-if="property?.name"> {{ property.name }} ({{ record?.keys }}) </template>
        <template v-else>{{ record?.keys }} </template>
        {{ property?.dataType?.specs?.unit }}
      </span>
      <span class="ml-4">
        <RadioGroup v-model:value="showChart" size="small" button-style="solid">
          <RadioButton :value="true"> 图表 </RadioButton>
          <RadioButton :value="false">表格 </RadioButton>
        </RadioGroup>
      </span>
    </template>

    <BasicForm @register="registerForm" />
    <Card v-show="showChart">
      <div ref="chartRef" style="width: 100%; height: 400px"></div>
    </Card>
    <BasicTable
      :columns="tableColumns"
      :dataSource="series"
      :pagination="false"
      size="small"
      :bordered="false"
      :scroll="{ y: 400 }"
      :showIndexColumn="false"
      v-show="!showChart"
    />
  </BasicModal>
</template>
<script lang="ts" setup name="TimeseriesModal">
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { ref, Ref, computed, watch } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Card, RadioGroup, RadioButton } from 'ant-design-vue';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { TelemetryQuery, TsData } from '/@/api/tb/telemetry';
  import { BasicColumn, BasicTable } from '/@/components/Table';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';
  import { isArray } from 'lodash-es';
  import dayjs from 'dayjs';

  const { t } = useI18n('tb');

  const modalHeight = ref(502);

  const chartRef = ref<HTMLDivElement | null>(null);
  const series = ref<Array<TsData>>([]);
  const LATEST_CMD_ID = ref(0);

  const record = ref<TelemetryQuery>();
  const showChart = ref(true);

  const rangePresets = ref([
    { label: '今天', value: [dayjs().startOf('D'), dayjs()] },
    { label: '最近1小时', value: [dayjs().subtract(1, 'hour'), dayjs()] },
    { label: '最近6小时', value: [dayjs().subtract(6, 'hour'), dayjs()] },
    { label: '最近1天', value: [dayjs().subtract(1, 'day').startOf('D'), dayjs()] },
    { label: '最近3天', value: [dayjs().subtract(2, 'day').startOf('D'), dayjs()] },
    { label: '最近7天', value: [dayjs().subtract(6, 'day').startOf('D'), dayjs()] },
  ]);

  const tableColumns: BasicColumn[] = [
    {
      title: '时间',
      dataIndex: 'ts',
      format: 'date|YYYY-MM-DD HH:mm:ss',
    },
    {
      title: '数值',
      dataIndex: 'value',
    },
  ];

  const inputFormSchemas: FormSchema[] = [
    { field: 'entityType', component: 'Input', show: false },
    { field: 'entityId', component: 'Input', show: false },
    { field: 'keys', component: 'Input', show: false },
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
        onChange: () => subscribeHistoryData(),
      },
      colProps: { lg: 10, md: 12 },
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
        onChange: () => subscribeHistoryData(),
      },
    },
    // {
    //   label: t('数据数量'),
    //   field: 'limit',
    //   defaultValue: 1000,
    //   component: 'InputNumber',
    //   componentProps: {
    //     min: 100,
    //     onChange: () => subscribeHistoryData(),
    //   },
    // },
    {
      label: t('聚合函数'),
      field: 'agg',
      component: 'Select',
      defaultValue: 'NONE',
      componentProps: {
        options: [
          { label: '无', value: 'NONE' },
          { label: '最小值', value: 'MIN' },
          { label: '最大值', value: 'MAX' },
          { label: '平均数', value: 'AVG' },
          { label: '求和', value: 'SUM' },
          { label: '计数', value: 'COUNT' },
        ],
        onChange: () => subscribeHistoryData(),
      },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
    labelWidth: 100,
    schemas: inputFormSchemas,
    baseColProps: { lg: 6, md: 12 },
  });

  const { setOptions, resize } = useECharts(chartRef as Ref<HTMLDivElement>);
  const { getAndIncrementCmdId, send: websocketSend, unsubscribe: websocketUnsubscribe } = useWebsocketStore();

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    showChart.value = false;
    record.value = { ...data, keys: data.keys };
    await resetFields();
    setFieldsValue(record.value);

    LATEST_CMD_ID.value = getAndIncrementCmdId();
    sendInitQuery();
    setModalProps({ loading: false });
  });

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
                singleEntity: { entityType: record.value?.entityType, id: record.value?.entityId },
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
      agg: 'NONE',
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
              keys: [record.value?.keys],
              agg: queryData.agg,
              startTs: dayjs(queryData.timeRange[0]).valueOf(),
              endTs: dayjs(queryData.timeRange[1]).valueOf(),
              interval: queryData.interval,
              intervalType: 'MILLISECONDS',
              limit: queryData.limit,
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
      const arrayData = data.update[0].timeseries[record.value?.keys] || [];
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
          lineStyle: {
            width: 1,
            color: '#019680',
          },
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
          itemStyle: {
            color: '#5ab1ef',
          },
        },
      ],
    });
  }

  watch(
    () => modalHeight.value,
    () => {
      resize();
    },
    { immediate: true },
  );

  const timeFormat = computed(() => {
    if (series.value.length > 2) {
      const diff = Math.abs(series.value[0].ts - series.value[series.value.length - 1].ts);
      if (diff < 3600 * 1000 * 24) {
        return 'HH:mm';
      }
      if (diff < 3600 * 1000 * 24 * 30) {
        return 'MM-DD HH时';
      }
      return 'YY-MM-DD';
    }
    return 'HH:mm';
  });

  function handleClose() {
    if (LATEST_CMD_ID.value > 0) {
      websocketUnsubscribe(LATEST_CMD_ID.value, {
        cmdId: LATEST_CMD_ID.value,
        type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE,
      });
    }
    closeModal();
  }
</script>
