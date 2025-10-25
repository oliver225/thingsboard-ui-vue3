<template>
  <Popover v-model:open="popoverOpen" trigger="click" placement="bottomRight">
    <template #content>
      <div class="p-2" style="width: 360px">
        <!-- 时间类型 -->
        <div class="mb-2">
          <RadioGroup v-model:value="localDataMode" button-style="solid">
            <RadioButton value="realtime">{{ t('common.realtime') }}</RadioButton>
            <RadioButton value="history">{{ t('common.history') }}</RadioButton>
          </RadioGroup>
        </div>

        <!-- 时间窗口（实时模式下显示） -->
        <div class="mb-2">
          <div class="flex items-center justify-between mb-1">
            <div class="font-500">{{ t('tb.gateway.details.timeFilter.timeWindow') }}</div>
            <Tag color="default">{{ timezoneLabel() }}</Tag>
          </div>

          <div class="space-y-2">
            <RadioGroup v-model:value="localRealtimeMode" button-style="solid">
              <RadioButton value="last">{{ t('tb.gateway.details.timeFilter.last') }}</RadioButton>
              <RadioButton value="relative">{{ t('tb.gateway.details.timeFilter.relative') }}</RadioButton>
              <RadioButton value="scope" v-if="localDataMode === 'history'">
                {{ t('tb.gateway.details.timeFilter.scope') }}
              </RadioButton>
            </RadioGroup>

            <!-- 最后  -->
            <Select
              v-if="localRealtimeMode === 'last'"
              v-model:value="localLastWindowMs"
              :options="LAST_WINDOW_OPTIONS"
              class="w-full"
            />
            <!-- 相对  -->
            <Select
              v-else-if="localRealtimeMode === 'relative'"
              v-model:value="localRelativeKey"
              :options="RELATIVE_OPTIONS"
              class="w-full"
            />
            <!-- 范围  -->
            <RangePicker
              v-else-if="localRealtimeMode === 'scope'"
              v-model:value="localTimeRange"
              style="width: 100%"
              show-time
              :allow-clear="true"
              format="YYYY/MM/DD HH:mm"
              :presets="rangePresets"
            />
          </div>
        </div>

        <!-- 聚合 -->
        <div class="mb-2">
          <div class="mb-1 font-500">{{ t('tb.gateway.details.timeFilter.aggregation') }}</div>
          <Select class="w-full" v-model:value="localAggregation" :options="AGGREGATION_OPTIONS" />
        </div>

        <!-- 限制数 -->
        <div class="mb-3">
          <div class="mb-1 font-500">{{ t('tb.gateway.details.timeFilter.limit') }}</div>
          <div class="flex items-center gap-2">
            <Slider :min="1" :max="50000" v-model:value="localLimit" class="flex-1" />
            <InputNumber :min="1" :max="50000" v-model:value="localLimit" style="width: 120px" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <a-button @click="popoverOpen = false">{{ t('tb.gateway.details.timeFilter.cancel') }}</a-button>
          <a-button type="primary" @click="handleApply">{{ t('tb.gateway.details.timeFilter.update') }}</a-button>
        </div>
      </div>
    </template>
    <Button type="primary">
      <template #icon> <Icon icon="i-ant-design:field-time-outlined" size="16" /> </template>
      {{ summaryText }}
    </Button>
  </Popover>
</template>

<script lang="ts" setup name="TimeFilter">
  import { ref, watch, computed } from 'vue';
  import {
    Popover,
    RadioGroup,
    RadioButton,
    Select,
    DatePicker,
    Tag,
    Slider,
    InputNumber,
    Button,
  } from 'ant-design-vue';
  import dayjs from 'dayjs';
  import quarterOfYear from 'dayjs/plugin/quarterOfYear';

  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Aggregation, AGGREGATION_OPTIONS } from '/@/enums/telemetryEnum';

  dayjs.extend(quarterOfYear);

  const RangePicker = DatePicker.RangePicker;
  const { t } = useI18n('tb');

  interface Props {
    dataMode?: 'realtime' | 'history';
    aggregation?: Aggregation;
    limit?: number;
    realtimeMode?: 'last' | 'relative' | 'scope';
    lastWindowMs?: number;
    relativeKey?: string;
    timeRange?: [dayjs.Dayjs, dayjs.Dayjs];
    keys?: string[]; // 需要订阅的 keys
  }

  const props = withDefaults(defineProps<Props>(), {
    dataMode: 'realtime',
    aggregation: Aggregation.NONE,
    limit: 25000,
    realtimeMode: 'last',
    lastWindowMs: 12 * 60 * 60 * 1000,
    relativeKey: 'currentDay',
    timeRange: () => [dayjs().subtract(6, 'hour'), dayjs()],
    keys: () => [],
  });

  interface ApplyResult {
    // 当前模式的渲染参数，可以直接解构到 cmds 中
    tsCmd?: any;
    historyCmd?: any;
  }

  const emit = defineEmits<{
    (e: 'update:dataMode', value: 'realtime' | 'history'): void;
    (e: 'update:aggregation', value: Aggregation): void;
    (e: 'update:limit', value: number): void;
    (e: 'update:realtimeMode', value: 'last' | 'relative' | 'scope'): void;
    (e: 'update:lastWindowMs', value: number): void;
    (e: 'update:relativeKey', value: string): void;
    (e: 'update:timeRange', value: [dayjs.Dayjs, dayjs.Dayjs]): void;
    (e: 'apply', result: ApplyResult): void;
  }>();

  const popoverOpen = ref(false);

  // 本地状态
  const localDataMode = ref(props.dataMode);
  const localAggregation = ref(props.aggregation);
  const localLimit = ref(props.limit);
  const localRealtimeMode = ref(props.realtimeMode);
  const localLastWindowMs = ref(props.lastWindowMs);
  const localRelativeKey = ref(props.relativeKey);
  const localTimeRange = ref(props.timeRange);

  // 同步 props 到本地状态
  watch(
    () => props.dataMode,
    (val) => (localDataMode.value = val),
  );
  watch(
    () => props.aggregation,
    (val) => (localAggregation.value = val),
  );
  watch(
    () => props.limit,
    (val) => (localLimit.value = val),
  );
  watch(
    () => props.realtimeMode,
    (val) => (localRealtimeMode.value = val),
  );
  watch(
    () => props.lastWindowMs,
    (val) => (localLastWindowMs.value = val),
  );
  watch(
    () => props.relativeKey,
    (val) => (localRelativeKey.value = val),
  );
  watch(
    () => props.timeRange,
    (val) => (localTimeRange.value = val),
    { deep: true },
  );

  // 监听模式切换：从历史回到实时时，若之前选择的是范围(scope)，复位为 last
  watch(localDataMode, (val) => {
    if (val === 'realtime' && localRealtimeMode.value === 'scope') {
      localRealtimeMode.value = 'last';
    }
  });

  // 最后
  const LAST_WINDOW_OPTIONS = [
    { value: 2 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastMinutes', { count: 2 }) },
    { value: 5 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastMinutes', { count: 5 }) },
    { value: 10 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastMinutes', { count: 10 }) },
    { value: 15 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastMinutes', { count: 15 }) },
    { value: 30 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastMinutes', { count: 30 }) },
    { value: 60 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastHours', { count: 1 }) },
    { value: 6 * 60 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastHours', { count: 6 }) },
    { value: 12 * 60 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastHours', { count: 12 }) },
    { value: 24 * 60 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastDays', { count: 1 }) },
    { value: 7 * 24 * 60 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastDays', { count: 7 }) },
    { value: 30 * 24 * 60 * 60 * 1000, label: t('tb.gateway.details.timeFilter.lastDays', { count: 30 }) },
  ];

  // 相对
  const RELATIVE_OPTIONS = [
    { value: 'currentHour', label: t('tb.gateway.details.timeFilter.currentHour') },
    { value: 'currentDay', label: t('tb.gateway.details.timeFilter.currentDay') },
    { value: 'todaySoFar', label: t('tb.gateway.details.timeFilter.todaySoFar') },
    { value: 'thisWeekMonSat', label: t('tb.gateway.details.timeFilter.thisWeekSunSat') },
    { value: 'thisWeekMonSun', label: t('tb.gateway.details.timeFilter.thisWeekMonSun') },
    { value: 'thisMonth', label: t('tb.gateway.details.timeFilter.thisMonth') },
    { value: 'thisMonthSoFar', label: t('tb.gateway.details.timeFilter.thisMonthSoFar') },
    { value: 'thisQuarter', label: t('tb.gateway.details.timeFilter.thisQuarter') },
    { value: 'thisQuarterSoFar', label: t('tb.gateway.details.timeFilter.thisQuarterSoFar') },
    { value: 'thisHalfYear', label: t('tb.gateway.details.timeFilter.thisHalfYear') },
    { value: 'thisHalfYearSoFar', label: t('tb.gateway.details.timeFilter.thisHalfYearSoFar') },
    { value: 'thisYear', label: t('tb.gateway.details.timeFilter.thisYear') },
    { value: 'thisYearSoFar', label: t('tb.gateway.details.timeFilter.thisYearSoFar') },
  ];

  // 范围
  const rangePresets = ref([
    { label: t('common.search.rangePresets.today'), value: [dayjs().startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last1Hour'), value: [dayjs().subtract(1, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last6Hours'), value: [dayjs().subtract(6, 'hour'), dayjs()] },
    { label: t('common.search.rangePresets.last1Day'), value: [dayjs().subtract(1, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last3Days'), value: [dayjs().subtract(2, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.last7Days'), value: [dayjs().subtract(6, 'day').startOf('D'), dayjs()] },
    { label: t('common.search.rangePresets.thisMonth'), value: [dayjs().startOf('month'), dayjs()] },
    { label: t('common.search.rangePresets.thisQuarter'), value: [dayjs().startOf('quarter'), dayjs()] },
    { label: t('common.search.rangePresets.thisYear'), value: [dayjs().startOf('year'), dayjs()] },
  ]);

  // 文案：汇总当前选择
  const summaryText = computed(() => {
    const modeText =
      localDataMode.value === 'realtime'
        ? t('tb.gateway.details.timeFilter.realtime')
        : t('tb.gateway.details.timeFilter.historical');
    let desc = modeText;

    if (localRealtimeMode.value === 'scope') {
      const [s, e] = localTimeRange.value || [];
      if (s && e) desc += ` - ${s.format('YYYY-MM-DD HH:mm')} ~ ${e.format('YYYY-MM-DD HH:mm')}`;
      return desc;
    }

    if (localRealtimeMode.value === 'last') {
      const opt = LAST_WINDOW_OPTIONS.find((o) => o.value === localLastWindowMs.value);
      if (opt?.label) desc += ` - ${t('tb.gateway.details.timeFilter.last')} ${opt.label}`;
      return desc;
    }

    if (localRealtimeMode.value === 'relative') {
      const opt = RELATIVE_OPTIONS.find((o) => o.value === localRelativeKey.value);
      if (opt?.label) desc += ` - ${t('tb.gateway.details.timeFilter.relative')} ${opt.label}`;
      return desc;
    }

    return desc;
  });

  // 时间窗口
  function timezoneLabel() {
    const off = -new Date().getTimezoneOffset();
    const h = Math.floor(off / 60);
    const m = Math.abs(off % 60);
    const sign = off >= 0 ? '+' : '-';
    return `UTC${sign}${String(Math.abs(h)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // 生成实时模式渲染参数
  function getRealtimeTsCmd(keys: string[]) {
    if (localRealtimeMode.value === 'last') {
      return {
        keys,
        startTs: Date.now() - localLastWindowMs.value,
        timeWindow: localLastWindowMs.value,
        interval: 1000,
        intervalType: 'MILLISECONDS',
        limit: localLimit.value,
        timeZoneId: 'Asia/Shanghai',
        agg: localAggregation.value,
      };
    }

    // 相对模式
    const now = dayjs();
    let start = now.startOf('D');
    if (localRelativeKey.value === 'currentHour') start = now.startOf('hour');
    if (localRelativeKey.value === 'currentDay') start = now.startOf('day');
    if (localRelativeKey.value === 'todaySoFar') start = dayjs().startOf('day');
    if (localRelativeKey.value === 'thisWeekMonSat') start = now.startOf('week');
    if (localRelativeKey.value === 'thisWeekMonSun') start = now.startOf('week');
    if (localRelativeKey.value === 'thisMonth') start = now.startOf('month');
    if (localRelativeKey.value === 'thisMonthSoFar') start = now.startOf('month');
    if (localRelativeKey.value === 'thisQuarter') start = now.startOf('quarter');
    if (localRelativeKey.value === 'thisQuarterSoFar') start = now.startOf('quarter');
    if (localRelativeKey.value === 'thisHalfYear')
      start = now.month() < 6 ? now.startOf('year') : now.month(6).startOf('month');
    if (localRelativeKey.value === 'thisHalfYearSoFar')
      start = now.month() < 6 ? now.startOf('year') : now.month(6).startOf('month');
    if (localRelativeKey.value === 'thisYear') start = now.startOf('year');
    if (localRelativeKey.value === 'thisYearSoFar') start = now.startOf('year');

    const startTs = start.valueOf();
    const timeWindow = Date.now() - startTs;
    return {
      keys,
      startTs,
      timeWindow,
      interval: 1000,
      intervalType: 'MILLISECONDS',
      limit: localLimit.value,
      timeZoneId: 'Asia/Shanghai',
      agg: localAggregation.value,
    };
  }

  // 生成历史模式渲染参数
  function getHistoryCmd(keys: string[]) {
    // 历史模式也支持：最后 / 相对 / 范围
    if (localRealtimeMode.value === 'scope') {
      // 范围：使用选择的时间段
      return {
        keys,
        startTs: localTimeRange.value?.[0]?.valueOf?.(),
        endTs: localTimeRange.value?.[1]?.valueOf?.(),
        interval: 1000,
        intervalType: 'MILLISECONDS',
        limit: localLimit.value,
        timeZoneId: 'Asia/Shanghai',
        agg: localAggregation.value,
      };
    }

    const now = dayjs();

    if (localRealtimeMode.value === 'last') {
      // 最后：以当前时间为截止
      return {
        keys,
        startTs: Date.now() - localLastWindowMs.value,
        endTs: Date.now(),
        interval: 1000,
        intervalType: 'MILLISECONDS',
        limit: localLimit.value,
        timeZoneId: 'Asia/Shanghai',
        agg: localAggregation.value,
      };
    }

    // 相对：根据相对键计算 start/end
    let start = now.startOf('D');
    let end = now.endOf('D');

    switch (localRelativeKey.value) {
      case 'currentHour':
        start = now.startOf('hour');
        end = now.endOf('hour');
        break;
      case 'currentDay':
        start = now.startOf('day');
        end = now.endOf('day');
        break;
      case 'todaySoFar':
        start = now.startOf('day');
        end = now; // 到目前为止
        break;
      case 'thisWeekMonSat':
      case 'thisWeekMonSun':
        start = now.startOf('week');
        end = now.endOf('week');
        break;
      case 'thisMonth':
        start = now.startOf('month');
        end = now.endOf('month');
        break;
      case 'thisMonthSoFar':
        start = now.startOf('month');
        end = now;
        break;
      case 'thisQuarter':
        start = now.startOf('quarter');
        end = now.endOf('quarter');
        break;
      case 'thisQuarterSoFar':
        start = now.startOf('quarter');
        end = now;
        break;
      case 'thisHalfYear': {
        const h1 = now.month() < 6;
        start = h1 ? now.startOf('year') : now.month(6).startOf('month');
        end = h1 ? now.month(5).endOf('month') : now.endOf('year');
        break;
      }
      case 'thisHalfYearSoFar': {
        const h1 = now.month() < 6;
        start = h1 ? now.startOf('year') : now.month(6).startOf('month');
        end = now;
        break;
      }
      case 'thisYear':
        start = now.startOf('year');
        end = now.endOf('year');
        break;
      case 'thisYearSoFar':
        start = now.startOf('year');
        end = now;
        break;
    }

    return {
      keys,
      startTs: start.valueOf(),
      endTs: end.valueOf(),
      interval: 1000,
      intervalType: 'MILLISECONDS',
      limit: localLimit.value,
      timeZoneId: 'Asia/Shanghai',
      agg: localAggregation.value,
    };
  }

  // 更新
  function handleApply() {
    popoverOpen.value = false;

    // 发送所有更新事件
    emit('update:dataMode', localDataMode.value);
    emit('update:aggregation', localAggregation.value);
    emit('update:limit', localLimit.value);
    emit('update:realtimeMode', localRealtimeMode.value);
    emit('update:lastWindowMs', localLastWindowMs.value);
    emit('update:relativeKey', localRelativeKey.value);
    emit('update:timeRange', localTimeRange.value);

    // 使用当前 keys 生成渲染参数
    const currentKeys = props.keys && props.keys.length > 0 ? props.keys : [];

    // 根据当前模式返回对应的渲染参数
    const result: ApplyResult =
      localDataMode.value === 'realtime'
        ? { tsCmd: getRealtimeTsCmd(currentKeys) }
        : { historyCmd: getHistoryCmd(currentKeys) };

    emit('apply', result);
  }

  // 暴露方法供父组件初次加载时调用
  function getInitialParams(keys: string[]) {
    return localDataMode.value === 'realtime' ? { tsCmd: getRealtimeTsCmd(keys) } : { historyCmd: getHistoryCmd(keys) };
  }

  defineExpose({
    getRealtimeTsCmd,
    getHistoryCmd,
    getInitialParams,
  });
</script>

<style scoped lang="less">
  .font-500 {
    font-weight: 500;
  }
</style>
