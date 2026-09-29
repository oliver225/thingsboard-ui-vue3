import type { TenantProfileFormValues } from './form-data';

import type { VbenFormSchema } from '#/adapter/form';
import type { FormValidationIssue } from '#/types/form';

import { h, markRaw } from 'vue';

import { VbenTooltip } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { z } from '#/adapter/form';
import { QueueProcessingStrategyType, QueueSubmitStrategyType } from '#/enums';
import { $t } from '#/locales';
import { isValidRateLimit } from '#/utils/rate-limit';

import { numericConfigurationFields, rateLimitFields } from './form-data';
import RateLimitInput from './rate-limit-input.vue';

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

function createIntegerRule(min: number) {
  const message = $t('tenant-profile.validation.integerMin', { min });
  return z
    .number({ error: message })
    .int(message)
    .min(min, message)
    .max(Number.MAX_SAFE_INTEGER, message);
}

function createNameRule() {
  return z
    .string()
    .trim()
    .min(1, $t('tenant-profile.validation.nameRequired'))
    .max(255, $t('tenant-profile.validation.nameMaxLength'));
}

export function validateTenantProfileValues(
  formValues: TenantProfileFormValues,
): FormValidationIssue[] {
  const issues: FormValidationIssue[] = [];
  const nameResult = createNameRule().safeParse(formValues.name);
  const nameIssue = nameResult.error?.issues[0];
  if (nameIssue) issues.push({ fieldName: 'name', message: nameIssue.message });
  for (const { key, min } of numericConfigurationFields) {
    if (key === 'maxSms' && !formValues.configuration.smsEnabled) continue;
    const result = createIntegerRule(min).safeParse(
      formValues.configuration[key],
    );
    const issue = result.error?.issues[0];
    if (issue)
      issues.push({
        fieldName: `configuration.${key}`,
        message: issue.message,
      });
  }
  for (const key of rateLimitFields) {
    if (!isValidRateLimit(formValues.configuration[key]))
      issues.push({
        fieldName: `configuration.${key}`,
        message: $t('tb.components.rateLimit.validation.invalid'),
      });
  }
  if (formValues.isolatedTbRuleEngine) {
    const names = new Set<string>();
    const queueSchema = createQueueValidationSchema();
    if (!formValues.queues.some((queue) => queue.name.trim() === 'Main'))
      issues.push({
        fieldName: '_queues',
        message: $t('tenant-profile.validation.mainQueue'),
      });
    formValues.queues.forEach((queue, index) => {
      const result = queueSchema.safeParse(queue);
      if (!result.success)
        for (const issue of result.error.issues)
          issues.push({
            fieldName: `queues[${index}].${issue.path.join('.')}`,
            message: issue.message,
          });
      const name = queue.name.trim();
      if (names.has(name))
        issues.push({
          fieldName: `queues[${index}].name`,
          message: $t('settings.features.queues.validation.uniqueName'),
        });
      names.add(name);
    });
  }
  return issues;
}

/** 配置组件只分组展示，子字段直接注册到同一个 VbenForm。 */
export function createConfigurationFormSchema(): VbenFormSchema[] {
  return [
    ...numericConfigurationFields.map(
      ({ key, min, defaultValue }): VbenFormSchema => ({
        component: 'InputNumber',
        componentProps: { min, precision: 0, max: Number.MAX_SAFE_INTEGER },
        defaultValue,
        fieldName: `configuration.${key}`,
        label: $t(`tenant-profile.features.configuration.${key}`),
        rules: createIntegerRule(min),
        dependencies:
          key === 'maxSms'
            ? {
                triggerFields: ['configuration.smsEnabled'],
                resolve: ({ values: formValues }) => ({
                  show: formValues.configuration?.smsEnabled,
                }),
              }
            : undefined,
        formItemClass: key === 'maxSms' ? 'sm:col-span-2' : '',
      }),
    ),
    {
      component: 'TbSwitch',
      hideLabel: true,
      defaultValue: true,
      fieldName: 'configuration.smsEnabled',
      componentProps: {
        title: $t('tenant-profile.features.configuration.smsEnabled'),
      },
      formItemClass: 'sm:col-span-2',
    },
    ...rateLimitFields.map((key): VbenFormSchema => ({
      component: markRaw(RateLimitInput),
      componentProps: {
        label: $t(`tenant-profile.features.configuration.${key}`),
      },
      defaultValue: '',
      modelPropName: 'value',
      fieldName: `configuration.${key}`,
      label: $t(`tenant-profile.features.configuration.${key}`),
      rules: z
        .string()
        .optional()
        .refine(
          (value) => isValidRateLimit(value ?? ''),
          $t('tb.components.rateLimit.validation.invalid'),
        ),
    })),
  ];
}

export function createTenantProfileFormSchema(): VbenFormSchema<TenantProfileFormValues>[] {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('tenant-profile.features.form.namePlaceholder'),
        maxlength: 255,
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('tenant-profile.fields.name'),
      rules: createNameRule(),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'TbSwitch',
      hideLabel: true,
      defaultValue: false,
      fieldName: 'isolatedTbRuleEngine',
      componentProps: {
        title: $t('tenant-profile.fields.isolatedTbRuleEngine'),
        description: $t('tenant-profile.features.form.isolatedHint'),
      },
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenInput',
      fieldName: '_queues',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['isolatedTbRuleEngine'],
        resolve: ({ values: formValues }) => ({
          show: formValues.isolatedTbRuleEngine,
        }),
      },
    },
    {
      component: 'VbenInput',
      fieldName: '_configuration',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      label: $t('tenant-profile.fields.description'),
      defaultValue: '',
      componentProps: {
        rows: 3,
        placeholder: $t('tenant-profile.features.form.descriptionPlaceholder'),
      },
      formItemClass: 'sm:col-span-2',
    },
  ];
}

const queueNumberFields = [
  ['partitions', 1],
  ['pollInterval', 1],
  ['packProcessingTimeout', 1],
  ['retries', 0],
  ['failurePercentage', 0],
  ['pauseBetweenRetries', 1],
  ['maxPauseBetweenRetries', 1],
] as const;

function createQueueIntegerRule(min: number, max = Number.MAX_SAFE_INTEGER) {
  const message =
    max === Number.MAX_SAFE_INTEGER
      ? $t('settings.features.queues.validation.integerMin', { min })
      : $t('settings.features.queues.validation.numberRange', { min, max });
  return z
    .number({ error: message })
    .int(message)
    .min(min, message)
    .max(max, message);
}

function createQueueValidationSchema() {
  const nameMessage = $t('settings.features.queues.validation.name');
  const integerRules = Object.fromEntries(
    queueNumberFields.map(([key, min]) => [
      key,
      createQueueIntegerRule(
        min,
        key === 'failurePercentage' ? 100 : Number.MAX_SAFE_INTEGER,
      ),
    ]),
  );
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, $t('settings.features.queues.validation.nameRequired'))
        .regex(/^[\w.-]+$/, nameMessage),
      submitType: z.enum(QueueSubmitStrategyType, {
        error: $t('settings.features.queues.validation.strategyRequired'),
      }),
      processingType: z.enum(QueueProcessingStrategyType, {
        error: $t('settings.features.queues.validation.strategyRequired'),
      }),
      ...integerRules,
      batchSize: z.unknown(),
      pauseBetweenRetries: createQueueIntegerRule(1),
      maxPauseBetweenRetries: createQueueIntegerRule(1),
    })
    .superRefine((formValues, ctx) => {
      if (
        formValues.submitType === QueueSubmitStrategyType.BATCH &&
        !createQueueIntegerRule(1).safeParse(formValues.batchSize).success
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['batchSize'],
          message: $t('settings.features.queues.validation.positiveInteger'),
        });
      }
      if (formValues.maxPauseBetweenRetries < formValues.pauseBetweenRetries) {
        ctx.addIssue({
          code: 'custom',
          path: ['maxPauseBetweenRetries'],
          message: $t('settings.features.queues.validation.maxPause'),
        });
      }
    });
}

interface QueueSchemaOptions {
  index: number;
  nameDisabled?: boolean;
}

/** 租户配置内的队列字段直接注册到父表单对应的数组路径。 */
export function createQueueFormSchema({
  index,
  nameDisabled,
}: QueueSchemaOptions): VbenFormSchema[] {
  const prefix = `queues[${index}].`;
  const schema: VbenFormSchema[] = [
    {
      component: 'VbenInput',
      fieldName: 'name',
      label: $t('settings.features.queues.fields.name'),
      defaultValue: '',
      componentProps: {
        disabled: nameDisabled,
        placeholder: $t('settings.features.queues.form.namePlaceholder'),
      },
      rules: z
        .string()
        .trim()
        .min(1, $t('settings.features.queues.validation.nameRequired'))
        .regex(/^[\w.-]+$/, $t('settings.features.queues.validation.name')),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'RadioGroup',
      fieldName: 'submitType',
      label: $t('settings.features.queues.fields.submitStrategy'),
      defaultValue: QueueSubmitStrategyType.BURST,
      componentProps: {
        class: 'queue-strategy-options',
        labelRender: ({ item }) =>
          renderStrategyLabel('submitStrategy', String(item.value)),
        options: Object.values(QueueSubmitStrategyType).map((value) => ({
          value,
          label: $t(`settings.features.queues.submitStrategy.${value}`),
        })),
      },
      rules: 'selectRequired',
    },
    {
      component: 'InputNumber',
      fieldName: 'batchSize',
      label: $t('settings.features.queues.fields.batchSize'),
      defaultValue: 1000,
      componentProps: { min: 1, precision: 0 },
      rules: createQueueIntegerRule(1),
      dependencies: {
        triggerFields: [`${prefix}submitType`],
        resolve: ({ values: formValues }) => ({
          show:
            formValues.queues?.[index]?.submitType ===
            QueueSubmitStrategyType.BATCH,
        }),
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'processingType',
      label: $t('settings.features.queues.fields.processingStrategy'),
      defaultValue: QueueProcessingStrategyType.SKIP_ALL_FAILURES,
      componentProps: {
        class: 'queue-strategy-options',
        labelRender: ({ item }) =>
          renderStrategyLabel('processingStrategy', String(item.value)),
        options: Object.values(QueueProcessingStrategyType).map((value) => ({
          value,
          label: $t(`settings.features.queues.processingStrategy.${value}`),
        })),
      },
      rules: 'selectRequired',
      formItemClass: 'sm:row-span-4',
    },
    ...queueNumberFields.map(([key, min]): VbenFormSchema => ({
      component: 'InputNumber',
      fieldName: key,
      label: $t(
        `settings.features.queues.fields.${key === 'retries' ? 'retriesUnlimited' : key}`,
      ),
      componentProps: {
        min,
        precision: 0,
        max: key === 'failurePercentage' ? 100 : Number.MAX_SAFE_INTEGER,
      },
      rules: createQueueIntegerRule(
        min,
        key === 'failurePercentage' ? 100 : Number.MAX_SAFE_INTEGER,
      ),
    })),
    ...(['consumerPerPartition', 'duplicateMsgToAllPartitions'] as const).map(
      (key): VbenFormSchema => ({
        component: 'TbCheckbox',
        fieldName: key,
        defaultValue: false,
        hideLabel: true,
        formItemClass: 'sm:col-span-2',
        componentProps: { title: $t(`settings.features.queues.fields.${key}`) },
      }),
    ),
    ...(['customProperties', 'description'] as const).map(
      (key): VbenFormSchema => ({
        component: 'Textarea',
        fieldName: key,
        label: $t(`settings.features.queues.fields.${key}`),
        defaultValue: '',
        componentProps: {
          rows: 3,
          placeholder: $t(`settings.features.queues.form.${key}Placeholder`),
        },
        formItemClass: 'sm:col-span-2',
      }),
    ),
  ];
  return schema.map((field) => ({
    ...field,
    fieldName: `${prefix}${field.fieldName}`,
  }));
}
