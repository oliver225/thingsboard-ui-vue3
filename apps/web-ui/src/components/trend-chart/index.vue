<script setup lang="ts">
import type { EchartsUIType, ECOption } from '@vben/plugins/echarts';

import { computed, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { usePreferences } from '@vben/preferences';

interface TrendSeries {
  name: string;
  color?: string;
  data: [number, number][];
}

const props = withDefaults(
  defineProps<{
    series: TrendSeries[];
    bar?: boolean;
    startTs?: number;
    endTs?: number;
    height?: string;
    hideLegend?: boolean;
    unit?: string;
    emptyMessage?: string;
  }>(),
  {
    startTs: undefined,
    endTs: undefined,
    height: '320px',
    unit: '',
    emptyMessage: '',
  },
);
const { isDark } = usePreferences();
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const hasData = computed(() =>
  props.series.some((series) => series.data.length > 0),
);
function formatValue(value: unknown) {
  // 时间序列的 tooltip 值为 [时间戳, 数值]，仅格式化数值维度。
  const numericValue = Array.isArray(value) ? value[1] : value;
  if (typeof numericValue !== 'number' || !Number.isFinite(numericValue))
    return '—';
  const formatted = numericValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  return [formatted, props.unit].filter(Boolean).join(' ');
}
const chartOptions = computed<ECOption>(() => {
  const colors = isDark.value
    ? {
        text: '#fafafa',
        muted: '#a1a1aa',
        border: '#303036',
        background: '#18181b',
      }
    : {
        text: '#27272a',
        muted: '#71717a',
        border: '#e4e4e7',
        background: '#ffffff',
      };
  return {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'inherit' },
    grid: {
      left: 8,
      right: 16,
      top: props.hideLegend ? 20 : 40,
      bottom: 12,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      renderMode: 'richText',
      confine: true,
      valueFormatter: props.unit ? formatValue : undefined,
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      padding: 12,
      textStyle: { color: colors.text, fontSize: 12 },
      axisPointer: {
        type: 'line',
        lineStyle: { color: colors.muted, type: 'dashed' },
      },
    },
    legend: {
      data: props.series.map((series) => series.name),
      show: !props.hideLegend,
      type: 'scroll',
      top: 4,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 3,
      itemGap: 18,
      textStyle: { color: colors.muted, fontSize: 12 },
      pageTextStyle: { color: colors.muted },
    },
    xAxis: {
      type: 'time',
      min: props.startTs,
      max: props.endTs,
      splitNumber: 4,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        hideOverlap: true,
        color: colors.muted,
        fontSize: 11,
        margin: 12,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      splitNumber: 4,
      max: hasData.value ? undefined : 4,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: colors.border, type: 'dashed' },
      },
      axisLabel: {
        show: hasData.value,
        formatter: props.unit ? formatValue : undefined,
        color: colors.muted,
        fontSize: 11,
        margin: 12,
      },
    },
    series: props.series.map(({ name, color, data }) => ({
      name,
      data,
      type: props.bar ? 'bar' : 'line',
      showSymbol: data.length === 1,
      symbol: 'circle',
      symbolSize: 6,
      connectNulls: false,
      barMaxWidth: 32,
      itemStyle: { color },
      lineStyle: {
        width: 2.5,
        color,
        cap: 'round',
        join: 'round',
      },
      areaStyle: props.bar ? undefined : { color, opacity: 0.06 },
      emphasis: { focus: 'series' },
    })),
  };
});

onMounted(() => {
  // 挂载后统一渲染；深度监听兼容直接追加或修改序列数据。
  watch(chartOptions, (options) => void renderEcharts(options), {
    deep: true,
    immediate: true,
  });
});
</script>

<template>
  <div class="relative min-w-0">
    <EchartsUI ref="chartRef" class="w-full" :height="height" />
    <div
      v-if="!hasData && emptyMessage"
      class="pointer-events-none absolute inset-0 flex items-center justify-center pb-10"
    >
      <span
        class="text-muted-foreground bg-card rounded-md border px-3 py-2 text-xs"
      >
        {{ emptyMessage }}
      </span>
    </div>
  </div>
</template>
