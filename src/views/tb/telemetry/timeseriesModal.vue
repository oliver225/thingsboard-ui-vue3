<template>
  <BasicModal
    v-bind="$attrs"
    width="60%"
    :show-ok-btn="false"
    :show-cancel-btn="false"
    @register="registerModal"
    @cancel="handleClose"
    @height-change="(height) => (modalHeight = height)"
  >
    <template #title>
      <span class="font-bold">
        <template v-if="record?.name"> {{ record.name }} ({{ record?.keys }}) </template>
        <template v-else>{{ record?.keys }} </template>
        {{ record?.unit }}
      </span>
      <span class="ml-4">
        <RadioGroup v-model:value="showChart" size="small" button-style="solid">
          <RadioButton :value="true"> {{ t('tb.telemetry.timeseries.chart') }} </RadioButton>
          <RadioButton :value="false">{{ t('tb.telemetry.timeseries.table') }} </RadioButton>
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

  // ======================== 数据定义 ========================
  const { t } = useI18n('tb');
  const modalHeight = ref(502);
  const chartRef = ref<HTMLDivElement | null>(null);
  const series = ref<Array<TsData>>([]);
  const LATEST_CMD_ID = ref(0);
  const record = ref<TelemetryQuery & { name?: string; unit?: string }>();
  const showChart = ref(false);
  const minInterval = ref(60000);

  // ======================== 常量定义 ========================
  const rangePresets = ref([
    { label: t('common.search.rangePresets.today'), value: [dayjs().startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last1Hour'), value: [dayjs().subtract(1, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last6Hours'), value: [dayjs().subtract(6, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last1Day'), value: [dayjs().subtract(1, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last3Days'), value: [dayjs().subtract(2, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last7Days'), value: [dayjs().subtract(6, 'day').startOf('D'), dayjs()] },
  ]);

  // 时间间隔选项
  const intervalOptions = ref([
    { label: t('tb.telemetry.timeseries.intervals.s1'), value: 1000 },
    { label: t('tb.telemetry.timeseries.intervals.m1'), value: 60000 },
    { label: t('tb.telemetry.timeseries.intervals.m5'), value: 300000 },
    { label: t('tb.telemetry.timeseries.intervals.m10'), value: 600000 },
    { label: t('tb.telemetry.timeseries.intervals.m30'), value: 1800000 },
    { label: t('tb.telemetry.timeseries.intervals.h1'), value: 3600000 },
    { label: t('tb.telemetry.timeseries.intervals.h2'), value: 7800000 },
    { label: t('tb.telemetry.timeseries.intervals.h6'), value: 21600000 },
    { label: t('tb.telemetry.timeseries.intervals.h12'), value: 43200000 },
    { label: t('tb.telemetry.timeseries.intervals.d1'), value: 86400000 },
    { label: t('tb.telemetry.timeseries.intervals.d7'), value: 604800000 },
    { label: t('tb.telemetry.timeseries.intervals.d15'), value: 1296000000 },
    { label: t('tb.telemetry.timeseries.intervals.d30'), value: 25920000000 },
  ]);

  // 表格列定义
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.telemetry.table.time'),
      dataIndex: 'ts',
      format: 'date|YYYY-MM-DD HH:mm:ss',
    },
    {
      title: t('tb.telemetry.table.value'),
      dataIndex: 'value',
    },
  ];

  // ======================== 表单配置 ========================
  const inputFormSchemas: FormSchema[] = [
    { field: 'entityType', component: 'Input', show: false },
    { field: 'entityId', component: 'Input', show: false },
    { field: 'keys', component: 'Input', show: false },
    { field: 'orderBy', component: 'Input', defaultValue: 'ASC', show: false },
    {
      label: t('tb.telemetry.timeseries.timeRange'),
      field: 'timeRange',
      component: 'RangePicker',
      componentProps: {
        presets: rangePresets.value,
        showTime: true,
        format: 'YYYY-MM-DD HH:mm',
        allowClear: false,
        onChange: handleTimeRangeChange(),
      },
      colProps: { lg: 10, md: 12 },
    },
    {
      label: t('tb.telemetry.timeseries.interval'),
      field: 'interval',
      component: 'Select',
      componentProps: {
        options: intervalOptions.value
          .filter((item) => item.value >= minInterval.value)
          .map((item) => ({ label: item.label, value: item.value })),
        onChange: () => subscribeHistoryData(),
      },
    },
    {
      label: t('tb.telemetry.timeseries.aggregation'),
      field: 'agg',
      component: 'Select',
      defaultValue: 'NONE',
      componentProps: {
        options: [
          { label: t('tb.telemetry.timeseries.aggregations.none'), value: 'NONE' },
          { label: t('tb.telemetry.timeseries.aggregations.min'), value: 'MIN' },
          { label: t('tb.telemetry.timeseries.aggregations.max'), value: 'MAX' },
          { label: t('tb.telemetry.timeseries.aggregations.avg'), value: 'AVG' },
          { label: t('tb.telemetry.timeseries.aggregations.sum'), value: 'SUM' },
          { label: t('tb.telemetry.timeseries.aggregations.count'), value: 'COUNT' },
        ],
        onChange: () => subscribeHistoryData(),
      },
    },
  ];

  // ======================== 组件初始化 ========================
  const [registerForm, { resetFields, setFieldsValue, validate, getFieldsValue, updateSchema }] = useForm({
    labelWidth: 100,
    schemas: inputFormSchemas,
    baseColProps: { lg: 6, md: 12 },
  });

  const { setOptions, resize } = useECharts(chartRef as Ref<HTMLDivElement>);
  const { getAndIncrementCmdId, send: websocketSend, unsubscribe: websocketUnsubscribe } = useWebsocketStore();

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    minInterval.value = 60000;
    showChart.value = false;
    record.value = { ...data, keys: data.keys, timeRange: [dayjs().subtract(2, 'hour'), dayjs()], interval: 60000 };

    await resetFields();
    setFieldsValue(record.value);

    LATEST_CMD_ID.value = getAndIncrementCmdId();
    sendInitQuery();
    setModalProps({ loading: false });
  });

  // ======================== 事件处理函数 ========================
  /**
   * 处理时间范围变更
   */
  function handleTimeRangeChange() {
    return (val: any) => {
      minInterval.value = Math.ceil(Number(val[1] - val[0]) / 700);
      setFieldsValue({
        ...getFieldsValue(),
        interval: intervalOptions.value.find((item) => item.value >= minInterval.value)?.value,
      });
      updateSchema({
        field: 'interval',
        componentProps: {
          options: intervalOptions.value
            .filter((item) => item.value >= minInterval.value)
            .map((item) => ({ label: item.label, value: item.value })),
          onChange: () => subscribeHistoryData(),
        },
      });
      subscribeHistoryData();
    };
  }

  /**
   * 发送初始查询请求
   */
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

  /**
   * 订阅历史数据
   */
  async function subscribeHistoryData() {
    let data: any = {};
    try {
      data = await validate();
    } catch (error: any) {
      console.error('表单验证失败:', error);
      return;
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

  /**
   * WebSocket消息处理
   */
  function onWebsocketMessage(data: any) {
    if (data.update && isArray(data.update)) {
      const arrayData = data.update[0].timeseries[record.value?.keys] || [];
      series.value = arrayData.map((item) => ({
        ts: item.ts,
        value: item.value,
      }));

      // 更新记录名称和单位信息
      if (data.update[0]?.entity?.name) {
        record.value = {
          ...record.value,
          name: data.update[0]?.entity?.name,
          unit: data.update[0]?.entity?.additionalInfo?.unit,
        } as TelemetryQuery & { name?: string; unit?: string };
      }

      series.value.sort((a, b) => a.ts - b.ts);
      // renderChart();
    } else {
      subscribeHistoryData();
    }
  }

  /**
   * 渲染图表
   */
  function renderChart() {
    if (!series.value.length) return;
    setOptions({
      tooltip: {
        trigger: 'axis',
        formatter: (arg: any) =>
          `${dayjs(Number.parseInt(arg[0].name)).format('YYYY-MM-DD HH:mm:ss')}<br/>${arg[0].value}${
            record.value?.unit ? `(${record.value.unit})` : ''
          }`,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        splitLine: { show: true, lineStyle: { width: 1, type: 'solid', color: 'rgba(226,226,226,0.5)' } },
        data: series.value.map((i) => i.ts),
        axisLabel: { formatter: (value) => dayjs(Number.parseInt(value)).format(timeFormat.value) },
      },
      yAxis: {
        type: 'value',
        splitNumber: 4,
        splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.2)', 'rgba(226,226,226,0.2)'] } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: series.value.map((i) => i.value),
          areaStyle: {},
        },
      ],
      grid: { left: '1%', right: '1%', top: '2%', bottom: 0, containLabel: true },
    });
  }

  /**
   * 关闭模态框处理
   */
  function handleClose() {
    if (LATEST_CMD_ID.value > 0) {
      websocketUnsubscribe(LATEST_CMD_ID.value, {
        cmdId: LATEST_CMD_ID.value,
        type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE,
      });
    }
    closeModal();
  }

  // ======================== 计算属性 ========================
  const timeFormat = computed(() => {
    if (series.value.length < 2) return 'HH:mm';

    const diff = Math.abs(series.value[0].ts - series.value[series.value.length - 1].ts);
    if (diff < 3600 * 1000 * 24) return 'HH:mm';

    if (diff < 3600 * 1000 * 24 * 30) return 'MM-DD HH时';

    return 'YY-MM-DD';
  });

  // ======================== 监听器 ========================

  watch(() => modalHeight.value, resize, { immediate: true });

  watch(() => series.value, renderChart);
</script>
