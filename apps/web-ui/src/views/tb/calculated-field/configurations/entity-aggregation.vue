<script lang="ts">
import type { CalculatedFieldFormValues } from '../form-data';
import type {
  CalculatedFieldDefinition,
  ConfigurationProps,
} from '../form-schema';

import type { ScriptTestData } from '#/adapter/component/script-test/types';
import type { VbenFormSchema } from '#/adapter/form';

import { computed, markRaw } from 'vue';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import utc from 'dayjs/plugin/utc';

import {
  toArgumentFormValues,
  toArgumentPayload,
  validateArguments,
} from '#/adapter/component/field-arguments/data';
import FieldArguments from '#/adapter/component/field-arguments/index.vue';
import FormField from '#/adapter/form-field.vue';
import { FormSection } from '#/components/form-section';
import { CalculatedFieldType } from '#/enums';
import { $t } from '#/locales';

import { toMetricFormValues, toMetricPayload } from '../form-data';
import Metrics, { validateMetricValues } from './metrics.vue';

dayjs.extend(utc);
dayjs.extend(advancedFormat);

export function getAggregationOffsetPreview(
  formValues: Pick<
    CalculatedFieldFormValues,
    'duration' | 'intervalType' | 'offset' | 'offsetEnabled'
  >,
  now = new Date(),
): undefined | { complete: boolean; interval: string } {
  const { intervalType: type, offset, duration } = formValues;
  if (!formValues.offsetEnabled || !Number.isSafeInteger(offset) || offset < 0)
    return;
  const seconds = offset % 60 !== 0;
  const hours = offset % 3600 === 0 && offset % 86_400 !== 0;
  const days = offset % 86_400 === 0;
  let time = days ? '' : 'HH:mm';
  if (seconds) time = 'HH:mm:ss';
  const dated = (format: string) => format + (time ? `, ${time}` : '');
  const current = dayjs(now).utc();
  let start = current.startOf('year').add(offset, 'second');
  if (type === 'CUSTOM') {
    if (!Number.isSafeInteger(duration) || duration <= 0) return;
    let format = seconds ? 'HH:mm:ss' : 'HH:mm';
    if (duration % 86_400 === 0) format = dated('[Day] D');
    const complete = duration >= 21_600 && duration < 86_400;
    const count = complete ? Math.floor(86_400 / duration) : 2;
    const intervals = Array.from(
      { length: count },
      (_, index) =>
        `${start.add(index * duration, 'second').format(format)} - ${start.add((index + 1) * duration, 'second').format(format)}`,
    );
    return { complete, interval: intervals.join('; ') + (complete ? '' : '…') };
  }
  if (type === 'WEEK' || type === 'WEEK_SUN_SAT' || type === 'YEAR') {
    if (type !== 'YEAR') {
      const precedingDays =
        type === 'WEEK' ? (current.day() + 6) % 7 : current.day();
      start = current
        .startOf('day')
        .subtract(precedingDays, 'day')
        .add(offset, 'second');
    }
    const point = start.format(dated(type === 'YEAR' ? 'MMM Do' : 'ddd'));
    return {
      complete: false,
      interval: `${point} - Next ${point}; Next ${point} - Following ${point}…`,
    };
  }
  let formats: string[];
  if (type === 'HOUR') {
    start = current.startOf('day').add(offset, 'second');
    formats = ['HH:mm:ss', !seconds && !hours && !days ? 'HH:mm' : 'HH:mm:ss'];
  } else if (type === 'DAY') {
    start = current.startOf('month').add(offset, 'second');
    formats = [
      hours ? 'HH:mm:ss' : '[Day] D, HH:mm:ss',
      seconds || days ? '[Day] D, HH:mm:ss' : '[Day] D, HH:mm',
    ];
  } else if (type === 'MONTH') {
    formats = [
      dated('Do [of month]'),
      dated('[Next] Do'),
      dated('[Following] Do'),
    ];
  } else {
    formats = [dated('MMM Do')];
  }
  let unit: 'day' | 'hour' | 'month' = 'month';
  if (type === 'HOUR') unit = 'hour';
  else if (type === 'DAY') unit = 'day';
  const points = [0, 1, 2].map((index) =>
    start
      .add(index * (type === 'QUARTER' ? 3 : 1), unit)
      .format(formats[index] ?? formats.at(-1)),
  );
  return {
    complete: false,
    interval: `${points[0]} - ${points[1]}; ${points[1]} - ${points[2]}…`,
  };
}

function getAggregationIntervalDuration(formValues: CalculatedFieldFormValues) {
  return {
    HOUR: 3600,
    DAY: 86_400,
    WEEK: 604_800,
    WEEK_SUN_SAT: 604_800,
    MONTH: 2_630_016,
    QUARTER: 7_889_238,
    YEAR: 31_536_000,
    CUSTOM: formValues.duration,
  }[formValues.intervalType];
}
function getMaxOffset(formValues: CalculatedFieldFormValues) {
  return (
    getAggregationIntervalDuration(formValues) -
    (formValues.intervalType === 'MONTH' ? 0 : 1)
  );
}
export const definition = {
  type: CalculatedFieldType.ENTITY_AGGREGATION,
  output: { decimals: true, timeSeriesOnly: true },
  getValues: (config, limits) => ({
    arguments: toArgumentFormValues(config.arguments, {
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
    }),
    metrics: toMetricFormValues(config),
    intervalType: config.interval?.type ?? 'HOUR',
    timezone:
      config.interval?.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    duration:
      config.interval?.durationSec ??
      limits?.minAllowedAggregationIntervalInSecForCF ??
      60,
    offsetEnabled: config.interval?.offsetSec !== undefined,
    offset:
      config.interval?.offsetSec ??
      ((limits?.minAllowedAggregationIntervalInSecForCF ?? 60) > 60 ? 60 : 1),
    watermarkEnabled: !!config.watermark,
    watermark: config.watermark?.duration ?? 3600,
    intermediate: config.produceIntermediateResult ?? false,
  }),
  validate(formValues, limits) {
    const issues = validateArguments(formValues.arguments, {
      maxArguments: limits?.maxArgumentsPerCF,
      maxDataPoints: limits?.maxDataPointsPerRollingArg,
      onlyCurrentEntity: true,
      latestTelemetryOnly: true,
    });
    if (formValues.metrics.length === 0)
      issues.push({
        fieldName: 'metrics',
        message: $t('calculated-fields.validation.metrics'),
      });
    const maxItems = (limits?.maxArgumentsPerCF ?? 0) - 2;
    if (maxItems > 0 && formValues.metrics.length > maxItems)
      issues.push({
        fieldName: 'metrics',
        message: $t('calculated-fields.validation.maxItems', {
          count: maxItems,
        }),
      });
    formValues.metrics.forEach((row, index) =>
      issues.push(
        ...validateMetricValues(
          row,
          formValues.type,
          formValues.arguments,
          formValues.metrics.slice(0, index).map((other) => other.name.trim()),
        ).map((issue) => ({
          ...issue,
          fieldName: `metrics[${index}].${issue.fieldName}`,
        })),
      ),
    );
    try {
      if (!formValues.timezone) throw new Error('Timezone is required');
      new Intl.DateTimeFormat('en', { timeZone: formValues.timezone }).format();
    } catch {
      issues.push({
        fieldName: 'timezone',
        message: $t('calculated-fields.validation.timezone'),
      });
    }
    if (
      formValues.intervalType === 'CUSTOM' &&
      (!Number.isSafeInteger(formValues.duration) ||
        formValues.duration <
          (limits?.minAllowedAggregationIntervalInSecForCF ?? 1) ||
        formValues.duration > Number.MAX_SAFE_INTEGER)
    )
      issues.push({
        fieldName: 'duration',
        message: $t('calculated-fields.validation.range', {
          min: limits?.minAllowedAggregationIntervalInSecForCF ?? 1,
          max: Number.MAX_SAFE_INTEGER,
        }),
      });
    if (
      formValues.intervalType === 'CUSTOM' &&
      formValues.duration > 0 &&
      (formValues.duration < 86_400
        ? 86_400 % formValues.duration !== 0
        : formValues.duration % 86_400 !== 0)
    ) {
      issues.push({
        fieldName: 'duration',
        message: $t('calculated-fields.features.aggregation.intervalMultiple'),
      });
    }
    if (
      formValues.offsetEnabled &&
      (!Number.isSafeInteger(formValues.offset) ||
        formValues.offset < 0 ||
        formValues.offset > getMaxOffset(formValues))
    )
      issues.push({
        fieldName: 'offset',
        message: $t('calculated-fields.validation.range', {
          min: 0,
          max: getMaxOffset(formValues),
        }),
      });
    if (
      formValues.watermarkEnabled &&
      (!Number.isSafeInteger(formValues.watermark) ||
        formValues.watermark < 60 ||
        formValues.watermark > Number.MAX_SAFE_INTEGER)
    )
      issues.push({
        fieldName: 'watermark',
        message: $t('calculated-fields.validation.range', {
          min: 60,
          max: Number.MAX_SAFE_INTEGER,
        }),
      });
    return issues;
  },
  toConfiguration: (formValues, limits) => ({
    arguments: toArgumentPayload(formValues.arguments, {
      includeDefaultValue: false,
    }),
    metrics: toMetricPayload(formValues.metrics),
    interval: {
      type: formValues.intervalType,
      tz: formValues.timezone,
      ...(formValues.intervalType === 'CUSTOM'
        ? { durationSec: formValues.duration }
        : {}),
      ...(formValues.offsetEnabled ? { offsetSec: formValues.offset } : {}),
    },
    ...(formValues.watermarkEnabled
      ? { watermark: { duration: formValues.watermark } }
      : {}),
    ...(getAggregationIntervalDuration(formValues) >
    (limits?.intermediateAggregationIntervalInSecForCF ?? 0)
      ? { produceIntermediateResult: formValues.intermediate }
      : {}),
  }),
} satisfies CalculatedFieldDefinition;
</script>

<script setup lang="ts">
const props = defineProps<ConfigurationProps>();
const emit = defineEmits<{ test: [request?: ScriptTestData] }>();
const argumentsFields = computed<VbenFormSchema[]>(() => {
  const { values: formValues, limits, entityName } = props;
  return [
    {
      fieldName: 'arguments',
      component: markRaw(FieldArguments),
      modelPropName: 'modelValue',
      hideLabel: true,
      formItemClass: 'pb-0 sm:col-span-2',
      componentProps: {
        onlyCurrentEntity: true,
        latestTelemetryOnly: true,
        hideDefaultValue: true,
        hideSource: true,
        hideKeyType: true,
        watchKeyChange: true,
        entityId: {
          entityType: formValues.entityType,
          id: formValues.entityId,
        },
        entityName,
        maxArguments: limits?.maxArgumentsPerCF,
        maxDataPoints: limits?.maxDataPointsPerRollingArg,
      },
    },
  ];
});
const metricsFields = computed<VbenFormSchema[]>(() => {
  const { values: formValues, limits, validationField } = props;
  return [
    {
      fieldName: 'metrics',
      component: markRaw(Metrics),
      modelPropName: 'modelValue',
      hideLabel: true,
      formItemClass: 'pb-0 sm:col-span-2',
      componentProps: {
        arguments: formValues.arguments,
        type: formValues.type,
        disabled: !formValues.entityType || !formValues.entityId,
        validationField,
        maxItems: limits?.maxArgumentsPerCF
          ? limits.maxArgumentsPerCF - 2
          : undefined,
        onTest: (request?: ScriptTestData) => emit('test', request),
      },
    },
  ];
});
const intervalFields = computed<VbenFormSchema[]>(() => {
  const { values: formValues, limits } = props;
  const offsetPreview = getAggregationOffsetPreview(formValues);
  return [
    {
      fieldName: 'intervalType',
      component: 'VbenSelect',
      label: $t('calculated-fields.fields.intervalType'),
      rules: 'selectRequired',
      componentProps: {
        options: [
          'HOUR',
          'DAY',
          'WEEK',
          'WEEK_SUN_SAT',
          'MONTH',
          'QUARTER',
          'YEAR',
          'CUSTOM',
        ].map((value) => ({
          value,
          label: $t(`calculated-fields.options.${value}`),
        })),
      },
    },
    {
      fieldName: 'timezone',
      component: 'Select',
      label: $t('calculated-fields.fields.timezone'),
      rules: 'required',
      componentProps: {
        showSearch: true,
        options: ['UTC', ...Intl.supportedValuesOf('timeZone')].map(
          (value) => ({ value, label: value }),
        ),
      },
    },
    ...(formValues.intervalType === 'CUSTOM'
      ? [
          {
            fieldName: 'duration',
            component: 'SecondsInput',
            modelPropName: 'modelValue',
            label: $t('calculated-fields.fields.duration'),
            help: $t('calculated-fields.features.aggregation.intervalMultiple'),
            componentProps: {
              min: limits?.minAllowedAggregationIntervalInSecForCF ?? 1,
              class: 'w-full',
              'aria-label': $t('calculated-fields.fields.duration'),
            },
          },
        ]
      : []),
    ...(['offsetEnabled', 'watermarkEnabled', 'intermediate'] as const).flatMap(
      (fieldName) => {
        const fields: VbenFormSchema[] = [
          {
            fieldName,
            component: 'TbSwitch',
            hideLabel: true,
            formItemClass: 'min-w-0 self-end pb-2 sm:col-start-1',
            componentProps: {
              title: $t(`calculated-fields.fields.${fieldName}`),
              class: 'bg-muted/40',
              description: [
                $t(`calculated-fields.messages.intervalHelp.${fieldName}`, {
                  time: `${limits?.intermediateAggregationIntervalInSecForCF ?? 0} ${$t('tb.components.secondsInput.options.seconds')}`,
                }),
                fieldName === 'offsetEnabled' && offsetPreview
                  ? $t(
                      `calculated-fields.features.aggregation.${offsetPreview.complete ? 'offsetExample' : 'offsetExampleContinued'}`,
                      { interval: offsetPreview.interval },
                    )
                  : '',
              ]
                .filter(Boolean)
                .join(' '),
              disabled:
                fieldName === 'intermediate' &&
                getAggregationIntervalDuration(formValues) <=
                  (limits?.intermediateAggregationIntervalInSecForCF ?? 0),
            },
          },
        ];
        if (fieldName === 'offsetEnabled' && formValues.offsetEnabled)
          fields.push({
            fieldName: 'offset',
            component: 'SecondsInput',
            modelPropName: 'modelValue',
            label: $t('calculated-fields.fields.offset'),
            hideLabel: true,
            formItemClass: 'min-w-0 pb-2',
            componentProps: {
              min: 0,
              max: getMaxOffset(formValues),
              class: 'min-h-[50px] w-full',
              'aria-label': $t('calculated-fields.fields.offset'),
            },
          });
        if (fieldName === 'watermarkEnabled' && formValues.watermarkEnabled)
          fields.push({
            fieldName: 'watermark',
            component: 'SecondsInput',
            modelPropName: 'modelValue',
            label: $t('calculated-fields.fields.watermark'),
            hideLabel: true,
            help: $t('calculated-fields.features.aggregation.watermarkHelp'),
            formItemClass: 'min-w-0 pb-2',
            componentProps: {
              min: 60,
              class: 'min-h-[50px] w-full',
              'aria-label': $t('calculated-fields.fields.watermark'),
            },
          });
        return fields;
      },
    ),
  ];
});
</script>

<template>
  <div class="space-y-4">
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.arguments')"
      :description="$t('calculated-fields.features.aggregation.argumentsHint')"
      :help="$t('calculated-fields.features.aggregation.argumentsHelp')"
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in argumentsFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.metrics')"
      :description="
        $t('calculated-fields.features.aggregation.entityMetricsHelp')
      "
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in metricsFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.interval')"
      :description="$t('calculated-fields.features.aggregation.intervalHelp')"
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in intervalFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
  </div>
</template>
