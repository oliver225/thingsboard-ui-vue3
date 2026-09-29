import type {
  TenantProfile,
  TenantProfileConfiguration,
  TenantProfileQueue,
} from '#/api/tb/tenant-profile';

import { QueueProcessingStrategyType, QueueSubmitStrategyType } from '#/enums';
import { normalizeRateLimit } from '#/utils/rate-limit';

// 字段及默认值依据 ui-ngx tenant.model.ts 和 default-tenant-profile-configuration.component.ts。

export const numericConfigurationFields = [
  {
    key: 'maxDevices',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxAssets',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxCustomers',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxUsers',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxDashboards',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxRuleChains',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxEdges',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxResourcesInBytes',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxOtaPackagesInBytes',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxResourceSize',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxTransportMessages',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxTransportDataPoints',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxREExecutions',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxJSExecutions',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxTbelExecutions',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxDPStorageDays',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxRuleNodeExecutionsPerMessage',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxEmails',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxSms',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxCreatedAlarms',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxDebugModeDurationMinutes',
    defaultValue: 15,
    min: 0,
  },
  {
    key: 'defaultStorageTtlDays',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'alarmsTtlDays',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'rpcTtlDays',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'queueStatsTtlDays',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'ruleEngineExceptionsTtlDays',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxWsSessionsPerTenant',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxWsSessionsPerCustomer',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxWsSessionsPerRegularUser',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxWsSessionsPerPublicUser',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'wsMsgQueueLimitPerSession',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxWsSubscriptionsPerTenant',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxWsSubscriptionsPerCustomer',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxWsSubscriptionsPerRegularUser',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxWsSubscriptionsPerPublicUser',
    defaultValue: 0,
    min: 0,
  },
  {
    key: 'maxCalculatedFieldsPerEntity',
    defaultValue: 5,
    min: 0,
  },
  {
    key: 'maxArgumentsPerCF',
    defaultValue: 10,
    min: 0,
  },
  {
    key: 'maxRelationLevelPerCfArgument',
    defaultValue: 2,
    min: 1,
  },
  {
    key: 'minAllowedDeduplicationIntervalInSecForCF',
    defaultValue: 10,
    min: 0,
  },
  {
    key: 'minAllowedAggregationIntervalInSecForCF',
    defaultValue: 60,
    min: 0,
  },
  {
    key: 'maxRelatedEntitiesToReturnPerCfArgument',
    defaultValue: 100,
    min: 1,
  },
  {
    key: 'minAllowedScheduledUpdateIntervalInSecForCF',
    defaultValue: 10,
    min: 0,
  },
  {
    key: 'intermediateAggregationIntervalInSecForCF',
    defaultValue: 300,
    min: 1,
  },
  {
    key: 'cfReevaluationCheckInterval',
    defaultValue: 60,
    min: 1,
  },
  {
    key: 'alarmsReevaluationInterval',
    defaultValue: 60,
    min: 1,
  },
  {
    key: 'maxDataPointsPerRollingArg',
    defaultValue: 1000,
    min: 0,
  },
  {
    key: 'maxStateSizeInKBytes',
    defaultValue: 32,
    min: 0,
  },
  {
    key: 'maxSingleValueArgumentSizeInKBytes',
    defaultValue: 2,
    min: 0,
  },
] as const;

export const rateLimitFields = [
  'transportTenantMsgRateLimit',
  'transportTenantTelemetryMsgRateLimit',
  'transportTenantTelemetryDataPointsRateLimit',
  'transportDeviceMsgRateLimit',
  'transportDeviceTelemetryMsgRateLimit',
  'transportDeviceTelemetryDataPointsRateLimit',
  'transportGatewayMsgRateLimit',
  'transportGatewayTelemetryMsgRateLimit',
  'transportGatewayTelemetryDataPointsRateLimit',
  'transportGatewayDeviceMsgRateLimit',
  'transportGatewayDeviceTelemetryMsgRateLimit',
  'transportGatewayDeviceTelemetryDataPointsRateLimit',
  'tenantEntityExportRateLimit',
  'tenantEntityImportRateLimit',
  'tenantNotificationRequestsRateLimit',
  'tenantNotificationRequestsPerRuleRateLimit',
  'tenantServerRestLimitsConfiguration',
  'customerServerRestLimitsConfiguration',
  'wsUpdatesPerSessionRateLimit',
  'cassandraWriteQueryTenantCoreRateLimits',
  'cassandraReadQueryTenantCoreRateLimits',
  'cassandraWriteQueryTenantRuleEngineRateLimits',
  'cassandraReadQueryTenantRuleEngineRateLimits',
  'edgeEventRateLimits',
  'edgeEventRateLimitsPerEdge',
  'edgeUplinkMessagesRateLimits',
  'edgeUplinkMessagesRateLimitsPerEdge',
  'calculatedFieldDebugEventsRateLimit',
] as const;

export type NumericConfigurationKey =
  (typeof numericConfigurationFields)[number]['key'];
export type RateLimitKey = (typeof rateLimitFields)[number];

/** 每次新建返回独立对象，不能共享可变的配置默认值。 */
export function createDefaultConfiguration() {
  return {
    ...(Object.fromEntries(
      numericConfigurationFields.map(({ key, defaultValue }) => [
        key,
        defaultValue,
      ]),
    ) as Record<NumericConfigurationKey, number>),
    ...(Object.fromEntries(rateLimitFields.map((key) => [key, ''])) as Record<
      RateLimitKey,
      string
    >),
    smsEnabled: true,
    type: 'DEFAULT' as const,
  };
}

/** 按 ui-ngx 的分组和字段顺序完整展示。 */
export const configurationGroups = [
  {
    key: 'entities',
    fields: [
      'maxDevices',
      'maxDashboards',
      'maxAssets',
      'maxUsers',
      'maxCustomers',
      'maxRuleChains',
      'maxEdges',
    ],
  },
  {
    key: 'ruleEngine',
    fields: [
      'maxREExecutions',
      'maxTransportMessages',
      'maxJSExecutions',
      'maxTbelExecutions',
      'maxRuleNodeExecutionsPerMessage',
      'maxTransportDataPoints',
    ],
  },
  {
    key: 'calculatedFields',
    fields: [
      'maxCalculatedFieldsPerEntity',
      'maxDataPointsPerRollingArg',
      'maxArgumentsPerCF',
      'maxStateSizeInKBytes',
      'maxSingleValueArgumentSizeInKBytes',
      'maxRelationLevelPerCfArgument',
      'minAllowedScheduledUpdateIntervalInSecForCF',
      'minAllowedAggregationIntervalInSecForCF',
      'minAllowedDeduplicationIntervalInSecForCF',
      'intermediateAggregationIntervalInSecForCF',
      'cfReevaluationCheckInterval',
      'maxRelatedEntitiesToReturnPerCfArgument',
      'calculatedFieldDebugEventsRateLimit',
    ],
  },
  {
    key: 'storage',
    fields: [
      'maxDPStorageDays',
      'alarmsTtlDays',
      'defaultStorageTtlDays',
      'rpcTtlDays',
      'queueStatsTtlDays',
      'ruleEngineExceptionsTtlDays',
    ],
  },
  {
    key: 'notifications',
    fields: [
      'smsEnabled',
      'maxSms',
      'maxEmails',
      'maxCreatedAlarms',
      'alarmsReevaluationInterval',
    ],
  },
  {
    key: 'debug',
    fields: ['maxDebugModeDurationMinutes'],
  },
  {
    key: 'files',
    fields: ['maxResourcesInBytes', 'maxOtaPackagesInBytes', 'maxResourceSize'],
  },
  {
    key: 'websocket',
    fields: [
      'maxWsSessionsPerTenant',
      'maxWsSubscriptionsPerTenant',
      'maxWsSessionsPerCustomer',
      'maxWsSubscriptionsPerCustomer',
      'maxWsSessionsPerPublicUser',
      'maxWsSubscriptionsPerPublicUser',
      'maxWsSessionsPerRegularUser',
      'maxWsSubscriptionsPerRegularUser',
      'wsMsgQueueLimitPerSession',
    ],
  },
  {
    key: 'rateLimits',
    fields: [
      'transportTenantMsgRateLimit',
      'transportDeviceMsgRateLimit',
      'transportTenantTelemetryMsgRateLimit',
      'transportDeviceTelemetryMsgRateLimit',
      'transportGatewayMsgRateLimit',
      'transportGatewayDeviceMsgRateLimit',
      'transportGatewayTelemetryMsgRateLimit',
      'transportGatewayDeviceTelemetryMsgRateLimit',
      'transportTenantTelemetryDataPointsRateLimit',
      'transportDeviceTelemetryDataPointsRateLimit',
      'transportGatewayTelemetryDataPointsRateLimit',
      'transportGatewayDeviceTelemetryDataPointsRateLimit',
      'tenantServerRestLimitsConfiguration',
      'customerServerRestLimitsConfiguration',
      'tenantEntityExportRateLimit',
      'tenantEntityImportRateLimit',
      'cassandraWriteQueryTenantCoreRateLimits',
      'cassandraReadQueryTenantCoreRateLimits',
      'cassandraWriteQueryTenantRuleEngineRateLimits',
      'cassandraReadQueryTenantRuleEngineRateLimits',
      'tenantNotificationRequestsRateLimit',
      'tenantNotificationRequestsPerRuleRateLimit',
      'edgeEventRateLimits',
      'edgeEventRateLimitsPerEdge',
      'edgeUplinkMessagesRateLimits',
      'edgeUplinkMessagesRateLimitsPerEdge',
      'wsUpdatesPerSessionRateLimit',
    ],
  },
] as const;

export interface QueueFormValues {
  batchSize: number;
  consumerPerPartition: boolean;
  customProperties: string;
  description: string;
  duplicateMsgToAllPartitions: boolean;
  failurePercentage: number;
  maxPauseBetweenRetries: number;
  name: string;
  packProcessingTimeout: number;
  partitions: number;
  pauseBetweenRetries: number;
  pollInterval: number;
  processingType: QueueProcessingStrategyType;
  retries: number;
  submitType: QueueSubmitStrategyType;
  /** 仅用于保留接口扩展字段，不会作为表单字段直接提交。 */
  source?: TenantProfileQueue;
}

/** 租户配置内的队列编辑值和默认值，保留原始数据以便提交时合并。 */
export function toQueueFormValues(queue?: TenantProfileQueue): QueueFormValues {
  return {
    batchSize: queue?.submitStrategy?.batchSize ?? 1000,
    consumerPerPartition: queue?.consumerPerPartition ?? false,
    customProperties: queue?.additionalInfo?.customProperties ?? '',
    description: queue?.additionalInfo?.description ?? '',
    duplicateMsgToAllPartitions:
      queue?.additionalInfo?.duplicateMsgToAllPartitions ?? false,
    failurePercentage: queue?.processingStrategy?.failurePercentage ?? 0,
    maxPauseBetweenRetries:
      queue?.processingStrategy?.maxPauseBetweenRetries ?? 3,
    name: queue?.name ?? '',
    packProcessingTimeout: queue?.packProcessingTimeout ?? 2000,
    partitions: queue?.partitions ?? 10,
    pauseBetweenRetries: queue?.processingStrategy?.pauseBetweenRetries ?? 3,
    pollInterval: queue?.pollInterval ?? 25,
    processingType:
      queue?.processingStrategy?.type ??
      QueueProcessingStrategyType.SKIP_ALL_FAILURES,
    retries: queue?.processingStrategy?.retries ?? 3,
    source: queue,
    submitType: queue?.submitStrategy?.type ?? QueueSubmitStrategyType.BURST,
  };
}

/** 显式转换可编辑字段，保留已有 topic 和嵌套扩展数据。 */
export function toQueuePayload(formValues: QueueFormValues) {
  const queue = formValues.source;
  const name = formValues.name.trim();
  return {
    ...queue,
    name,
    topic:
      queue?.name === name && queue.topic
        ? queue.topic
        : `tb_rule_engine.${name}`,
    consumerPerPartition: formValues.consumerPerPartition,
    partitions: formValues.partitions,
    pollInterval: formValues.pollInterval,
    packProcessingTimeout: formValues.packProcessingTimeout,
    submitStrategy: {
      ...queue?.submitStrategy,
      type: formValues.submitType,
      // ui-ngx 只有 BATCH 策略使用批量大小，其他策略提交 null。
      batchSize:
        formValues.submitType === QueueSubmitStrategyType.BATCH
          ? formValues.batchSize
          : null,
    },
    processingStrategy: {
      ...queue?.processingStrategy,
      type: formValues.processingType,
      retries: formValues.retries,
      failurePercentage: formValues.failurePercentage,
      pauseBetweenRetries: formValues.pauseBetweenRetries,
      maxPauseBetweenRetries: formValues.maxPauseBetweenRetries,
    },
    additionalInfo: {
      ...queue?.additionalInfo,
      description: formValues.description,
      customProperties: formValues.customProperties,
      duplicateMsgToAllPartitions: formValues.duplicateMsgToAllPartitions,
    },
  };
}

/** 与 ui-ngx 新启用独立规则引擎时的三个预置队列保持一致。 */
function createDefaultQueues(): QueueFormValues[] {
  return [
    {
      name: 'Main',
      topic: 'tb_rule_engine.main',
      batchSize: 1000,
      retries: 3,
      pause: 3,
      submitType: QueueSubmitStrategyType.BURST,
      processingType: QueueProcessingStrategyType.SKIP_ALL_FAILURES,
    },
    {
      name: 'HighPriority',
      topic: 'tb_rule_engine.hp',
      batchSize: 100,
      retries: 0,
      pause: 5,
      submitType: QueueSubmitStrategyType.BURST,
      processingType: QueueProcessingStrategyType.RETRY_FAILED_AND_TIMED_OUT,
    },
    {
      name: 'SequentialByOriginator',
      topic: 'tb_rule_engine.sq',
      batchSize: 100,
      retries: 3,
      pause: 5,
      submitType: QueueSubmitStrategyType.SEQUENTIAL_BY_ORIGINATOR,
      processingType: QueueProcessingStrategyType.RETRY_FAILED_AND_TIMED_OUT,
    },
  ].map((preset) =>
    toQueueFormValues({
      id: crypto.randomUUID(),
      name: preset.name,
      topic: preset.topic,
      partitions: 1,
      pollInterval: 2000,
      packProcessingTimeout: 10_000,
      submitStrategy: { type: preset.submitType, batchSize: preset.batchSize },
      processingStrategy: {
        type: preset.processingType,
        retries: preset.retries,
        pauseBetweenRetries: preset.pause,
        maxPauseBetweenRetries: preset.pause,
        failurePercentage: 0,
      },
    }),
  );
}

export function createDefaultQueueFormValues() {
  return toQueueFormValues({ id: crypto.randomUUID() });
}

export interface TenantProfileFormValues {
  _configuration?: string;
  _queues?: string;
  configuration: ReturnType<typeof createDefaultConfiguration> &
    TenantProfileConfiguration;
  description: string;
  isolatedTbRuleEngine: boolean;
  name: string;
  queues: QueueFormValues[];
}

export function toTenantProfileFormValues(
  record?: null | TenantProfile,
): TenantProfileFormValues {
  const configuration = {
    ...createDefaultConfiguration(),
    ...record?.profileData?.configuration,
  };
  // 旧版本未设置限流时可能返回 null，统一转为组件可编辑的空字符串。
  for (const key of rateLimitFields) configuration[key] ??= '';
  configuration.smsEnabled ??= true;
  const queues = record?.profileData?.queueConfiguration;
  return {
    configuration,
    description: record?.description ?? '',
    isolatedTbRuleEngine: record?.isolatedTbRuleEngine ?? false,
    name: record?.name ?? '',
    queues: queues?.length
      ? queues.map((queue) => toQueueFormValues(queue))
      : createDefaultQueues(),
  };
}

export function toTenantProfilePayload(
  formValues: TenantProfileFormValues,
  record?: null | TenantProfile,
): TenantProfile {
  const configuration = {
    ...record?.profileData?.configuration,
    ...formValues.configuration,
  };
  for (const key of rateLimitFields)
    configuration[key] = normalizeRateLimit(formValues.configuration[key]);
  return {
    ...record,
    name: formValues.name.trim(),
    description: formValues.description,
    isolatedTbRuleEngine: formValues.isolatedTbRuleEngine,
    profileData: {
      ...record?.profileData,
      configuration,
      // 关闭独立引擎时按 ui-ngx 契约提交 null；编辑过程仍保留队列草稿，重新开启可恢复。
      queueConfiguration: formValues.isolatedTbRuleEngine
        ? formValues.queues.map((queue): TenantProfileQueue => ({
            ...toQueuePayload(queue),
            id:
              typeof queue.source?.id === 'string'
                ? queue.source.id
                : crypto.randomUUID(),
          }))
        : null,
    },
  };
}
