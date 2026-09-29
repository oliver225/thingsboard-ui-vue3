import type { Queue } from '#/api/tb/queue';

import { QueueProcessingStrategyType, QueueSubmitStrategyType } from '#/enums';

/** 系统队列表单独立维护，不携带租户配置的队列 ID 或草稿元数据。 */
export interface QueueFormValues {
  name: string;
  submitType: QueueSubmitStrategyType;
  batchSize: null | number;
  processingType: QueueProcessingStrategyType;
  retries: number;
  failurePercentage: number;
  pauseBetweenRetries: number;
  maxPauseBetweenRetries: number;
  pollInterval: number;
  partitions: number;
  packProcessingTimeout: number;
  consumerPerPartition: boolean;
  duplicateMsgToAllPartitions: boolean;
  customProperties: string;
  description: string;
}

/** 分组字段清单：回填和错误定位都使用同一份映射。 */
export const queueFormFields = {
  general: ['name'],
  submit: ['submitType', 'batchSize'],
  processing: [
    'processingType',
    'retries',
    'failurePercentage',
    'pauseBetweenRetries',
    'maxPauseBetweenRetries',
  ],
  polling: [
    'pollInterval',
    'partitions',
    'packProcessingTimeout',
    'consumerPerPartition',
  ],
  additional: [
    'duplicateMsgToAllPartitions',
    'customProperties',
    'description',
  ],
} as const satisfies Record<string, readonly (keyof QueueFormValues)[]>;

export type QueueFormGroup = keyof typeof queueFormFields;

export type QueueGroupValues<TGroup extends QueueFormGroup> = Pick<
  QueueFormValues,
  (typeof queueFormFields)[TGroup][number]
>;

export function toQueueFormValues(queue?: Queue): QueueFormValues {
  return {
    name: queue?.name ?? '',
    submitType: queue?.submitStrategy?.type ?? QueueSubmitStrategyType.BURST,
    batchSize: queue?.submitStrategy?.batchSize ?? 1000,
    processingType:
      queue?.processingStrategy?.type ??
      QueueProcessingStrategyType.SKIP_ALL_FAILURES,
    retries: queue?.processingStrategy?.retries ?? 3,
    failurePercentage: queue?.processingStrategy?.failurePercentage ?? 0,
    pauseBetweenRetries: queue?.processingStrategy?.pauseBetweenRetries ?? 3,
    maxPauseBetweenRetries:
      queue?.processingStrategy?.maxPauseBetweenRetries ?? 3,
    pollInterval: queue?.pollInterval ?? 25,
    partitions: queue?.partitions ?? 10,
    packProcessingTimeout: queue?.packProcessingTimeout ?? 2000,
    consumerPerPartition: queue?.consumerPerPartition ?? false,
    duplicateMsgToAllPartitions:
      queue?.additionalInfo?.duplicateMsgToAllPartitions ?? false,
    customProperties: queue?.additionalInfo?.customProperties ?? '',
    description: queue?.additionalInfo?.description ?? '',
  };
}

/** 只回填当前卡片的字段，避免不同 VbenForm 的副本覆盖用户输入。 */
export function pickQueueFormValues<TGroup extends QueueFormGroup>(
  values: QueueFormValues,
  group: TGroup,
): QueueGroupValues<TGroup> {
  return Object.fromEntries(
    queueFormFields[group].map((fieldName) => [fieldName, values[fieldName]]),
  ) as QueueGroupValues<TGroup>;
}

export function toQueuePayload(
  values: QueueFormValues,
  record?: null | Queue,
): Queue {
  const name = values.name.trim();
  return {
    ...record,
    name,
    topic:
      record?.name === name && record.topic
        ? record.topic
        : `tb_rule_engine.${name}`,
    pollInterval: values.pollInterval,
    partitions: values.partitions,
    packProcessingTimeout: values.packProcessingTimeout,
    consumerPerPartition: values.consumerPerPartition,
    submitStrategy: {
      ...record?.submitStrategy,
      type: values.submitType,
      batchSize:
        values.submitType === QueueSubmitStrategyType.BATCH
          ? values.batchSize
          : null,
    },
    processingStrategy: {
      ...record?.processingStrategy,
      type: values.processingType,
      retries: values.retries,
      failurePercentage: values.failurePercentage,
      pauseBetweenRetries: values.pauseBetweenRetries,
      maxPauseBetweenRetries: values.maxPauseBetweenRetries,
    },
    additionalInfo: {
      ...record?.additionalInfo,
      duplicateMsgToAllPartitions: values.duplicateMsgToAllPartitions,
      customProperties: values.customProperties,
      description: values.description,
    },
  };
}
