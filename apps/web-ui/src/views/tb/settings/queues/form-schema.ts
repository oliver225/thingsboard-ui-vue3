import type { QueueFormGroup, QueueFormValues } from './form-data';

import type { VbenFormSchema } from '#/adapter/form';

import { h } from 'vue';

import { VbenTooltip } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { z } from '#/adapter/form';
import { QueueProcessingStrategyType, QueueSubmitStrategyType } from '#/enums';
import { $t } from '#/locales';

type QueueFormSchema = VbenFormSchema<Partial<QueueFormValues>>;

type QueueNumberField = {
  [TField in keyof QueueFormValues]: QueueFormValues[TField] extends
    | null
    | number
    ? TField
    : never;
}[keyof QueueFormValues];

/** 策略说明沿用 ui-ngx；提示按钮独立处理点击，避免误选单选项。 */
function renderStrategyLabel(
  group: 'processingStrategy' | 'submitStrategy',
  value: string,
) {
  const label = $t(`settings.features.queues.${group}.${value}`);
  return h('span', { class: 'inline-flex items-center gap-1.5' }, [
    h('span', label),
    h(
      VbenTooltip,
      {
        side: 'top',
        contentClass: 'max-w-80 whitespace-normal text-sm leading-5',
      },
      {
        trigger: () =>
          h(
            'button',
            {
              type: 'button',
              tabindex: 0,
              class:
                'text-muted-foreground hover:text-primary focus-visible:ring-ring inline-flex shrink-0 rounded-sm outline-none focus-visible:ring-2',
              'aria-label': $t('settings.features.queues.form.strategyHelp', {
                strategy: label,
              }),
              onClick: (event: MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
              },
            },
            [
              h(IconifyIcon, {
                icon: 'lucide:info',
                class: 'size-3.5',
                'aria-hidden': true,
              }),
            ],
          ),
        default: () => $t(`settings.features.queues.${group}Help.${value}`),
      },
    ),
  ]);
}

function createIntegerRule(min: number, max = Number.MAX_SAFE_INTEGER) {
  const error =
    max === Number.MAX_SAFE_INTEGER
      ? $t('settings.features.queues.validation.integerMin', { min })
      : $t('settings.features.queues.validation.numberRange', { min, max });
  return z.number({ error }).int(error).min(min, error).max(max, error);
}

function createQueueFieldRules() {
  return {
    name: z
      .string()
      .trim()
      .min(1, $t('settings.features.queues.validation.nameRequired'))
      .regex(/^[\w.-]+$/, $t('settings.features.queues.validation.name')),
    submitType: z.enum(QueueSubmitStrategyType, {
      error: $t('settings.features.queues.validation.strategyRequired'),
    }),
    batchSize: z.number().nullable().optional(),
    processingType: z.enum(QueueProcessingStrategyType, {
      error: $t('settings.features.queues.validation.strategyRequired'),
    }),
    retries: createIntegerRule(0),
    failurePercentage: createIntegerRule(0, 100),
    pauseBetweenRetries: createIntegerRule(1),
    maxPauseBetweenRetries: createIntegerRule(1),
    pollInterval: createIntegerRule(1),
    partitions: createIntegerRule(1),
    packProcessingTimeout: createIntegerRule(1),
    consumerPerPartition: z.boolean(),
    duplicateMsgToAllPartitions: z.boolean(),
    customProperties: z.string(),
    description: z.string(),
  };
}

export function createQueueValidationSchema() {
  return z
    .object(createQueueFieldRules())
    .superRefine((values, ctx) => {
      if (
        values.submitType === QueueSubmitStrategyType.BATCH &&
        !createIntegerRule(1).safeParse(values.batchSize).success
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['batchSize'],
          message: $t('settings.features.queues.validation.positiveInteger'),
        });
      }
      if (values.maxPauseBetweenRetries < values.pauseBetweenRetries) {
        ctx.addIssue({
          code: 'custom',
          path: ['maxPauseBetweenRetries'],
          message: $t('settings.features.queues.validation.maxPause'),
        });
      }
    })
    .transform((values): QueueFormValues => ({
      ...values,
      batchSize: values.batchSize ?? null,
    }));
}

export function createQueueFormSchemas({
  nameDisabled = false,
}: { nameDisabled?: boolean } = {}): Record<QueueFormGroup, QueueFormSchema[]> {
  const rules = createQueueFieldRules();
  function createNumberField(
    fieldName: QueueNumberField,
    min: number,
    max = Number.MAX_SAFE_INTEGER,
  ): QueueFormSchema {
    return {
      component: 'InputNumber',
      componentProps: { precision: 0, min, max },
      fieldName,
      label: $t(`settings.features.queues.fields.${fieldName}`),
      rules:
        fieldName === 'batchSize' ? createIntegerRule(1) : rules[fieldName],
    };
  }
  function createCheckboxField(
    fieldName: 'consumerPerPartition' | 'duplicateMsgToAllPartitions',
  ): QueueFormSchema {
    return {
      component: 'TbCheckbox',
      fieldName,
      hideLabel: true,
      formItemClass: 'md:col-span-2',
      componentProps: {
        title: $t(`settings.features.queues.fields.${fieldName}`),
      },
    };
  }
  return {
    general: [
      {
        component: 'VbenInput',
        componentProps: {
          disabled: nameDisabled,
          placeholder: $t('settings.features.queues.form.namePlaceholder'),
        },
        fieldName: 'name',
        label: $t('settings.features.queues.fields.name'),
        rules: rules.name,
        formItemClass: 'md:col-span-2',
      },
    ],
    submit: [
      {
        component: 'RadioGroup',
        componentProps: {
          class: 'queue-strategy-options',
          labelRender: ({ item }) =>
            renderStrategyLabel('submitStrategy', String(item.value)),
          options: [
            QueueSubmitStrategyType.SEQUENTIAL_BY_ORIGINATOR,
            QueueSubmitStrategyType.SEQUENTIAL_BY_TENANT,
            QueueSubmitStrategyType.SEQUENTIAL,
            QueueSubmitStrategyType.BURST,
            QueueSubmitStrategyType.BATCH,
          ].map((value) => ({
            value,
            label: $t(`settings.features.queues.submitStrategy.${value}`),
          })),
        },
        fieldName: 'submitType',
        label: $t('settings.features.queues.fields.submitStrategy'),
        rules: rules.submitType,
      },
      {
        ...createNumberField('batchSize', 1),
        dependencies: {
          triggerFields: ['submitType'],
          resolve: ({ values }) => ({
            show: values.submitType === QueueSubmitStrategyType.BATCH,
          }),
        },
      },
    ],
    processing: [
      {
        component: 'RadioGroup',
        componentProps: {
          class: 'queue-strategy-options',
          labelRender: ({ item }) =>
            renderStrategyLabel('processingStrategy', String(item.value)),
          options: [
            QueueProcessingStrategyType.RETRY_FAILED_AND_TIMED_OUT,
            QueueProcessingStrategyType.SKIP_ALL_FAILURES,
            QueueProcessingStrategyType.SKIP_ALL_FAILURES_AND_TIMED_OUT,
            QueueProcessingStrategyType.RETRY_ALL,
            QueueProcessingStrategyType.RETRY_FAILED,
            QueueProcessingStrategyType.RETRY_TIMED_OUT,
          ].map((value) => ({
            value,
            label: $t(`settings.features.queues.processingStrategy.${value}`),
          })),
        },
        fieldName: 'processingType',
        label: $t('settings.features.queues.fields.processingStrategy'),
        rules: rules.processingType,
        formItemClass: 'md:row-span-4',
      },
      {
        ...createNumberField('retries', 0),
        label: $t('settings.features.queues.fields.retriesUnlimited'),
      },
      createNumberField('failurePercentage', 0, 100),
      createNumberField('pauseBetweenRetries', 1),
      createNumberField('maxPauseBetweenRetries', 1),
    ],
    polling: [
      createNumberField('pollInterval', 1),
      createNumberField('partitions', 1),
      createNumberField('packProcessingTimeout', 1),
      createCheckboxField('consumerPerPartition'),
    ],
    additional: [
      createCheckboxField('duplicateMsgToAllPartitions'),
      ...(['customProperties', 'description'] as const).map(
        (fieldName): QueueFormSchema => ({
          component: 'Textarea',
          componentProps: {
            rows: 3,
            class: 'rounded-md shadow-xs',
            placeholder: $t(
              `settings.features.queues.form.${fieldName}Placeholder`,
            ),
          },
          fieldName,
          label: $t(`settings.features.queues.fields.${fieldName}`),
          formItemClass: 'md:col-span-2',
        }),
      ),
    ],
  };
}
