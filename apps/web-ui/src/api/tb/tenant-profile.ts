/**
 * 租户配置接口(SYS_ADMIN)
 * 契约参考:后端 TenantProfileController.java
 */
import type { Queue } from '#/api/tb/queue';
import type { EntityType } from '#/enums';
import type { BaseData, EntityInfo, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

export type TenantProfileNumericKey =
  | 'alarmsReevaluationInterval'
  | 'alarmsTtlDays'
  | 'cfReevaluationCheckInterval'
  | 'defaultStorageTtlDays'
  | 'intermediateAggregationIntervalInSecForCF'
  | 'maxArgumentsPerCF'
  | 'maxAssets'
  | 'maxCalculatedFieldsPerEntity'
  | 'maxCreatedAlarms'
  | 'maxCustomers'
  | 'maxDashboards'
  | 'maxDataPointsPerRollingArg'
  | 'maxDebugModeDurationMinutes'
  | 'maxDevices'
  | 'maxDPStorageDays'
  | 'maxEdges'
  | 'maxEmails'
  | 'maxJSExecutions'
  | 'maxOtaPackagesInBytes'
  | 'maxREExecutions'
  | 'maxRelatedEntitiesToReturnPerCfArgument'
  | 'maxRelationLevelPerCfArgument'
  | 'maxResourcesInBytes'
  | 'maxResourceSize'
  | 'maxRuleChains'
  | 'maxRuleNodeExecutionsPerMessage'
  | 'maxSingleValueArgumentSizeInKBytes'
  | 'maxSms'
  | 'maxStateSizeInKBytes'
  | 'maxTbelExecutions'
  | 'maxTransportDataPoints'
  | 'maxTransportMessages'
  | 'maxUsers'
  | 'maxWsSessionsPerCustomer'
  | 'maxWsSessionsPerPublicUser'
  | 'maxWsSessionsPerRegularUser'
  | 'maxWsSessionsPerTenant'
  | 'maxWsSubscriptionsPerCustomer'
  | 'maxWsSubscriptionsPerPublicUser'
  | 'maxWsSubscriptionsPerRegularUser'
  | 'maxWsSubscriptionsPerTenant'
  | 'minAllowedAggregationIntervalInSecForCF'
  | 'minAllowedDeduplicationIntervalInSecForCF'
  | 'minAllowedScheduledUpdateIntervalInSecForCF'
  | 'queueStatsTtlDays'
  | 'rpcTtlDays'
  | 'ruleEngineExceptionsTtlDays'
  | 'wsMsgQueueLimitPerSession';
export type TenantProfileRateLimitKey =
  | 'calculatedFieldDebugEventsRateLimit'
  | 'cassandraReadQueryTenantCoreRateLimits'
  | 'cassandraReadQueryTenantRuleEngineRateLimits'
  | 'cassandraWriteQueryTenantCoreRateLimits'
  | 'cassandraWriteQueryTenantRuleEngineRateLimits'
  | 'customerServerRestLimitsConfiguration'
  | 'edgeEventRateLimits'
  | 'edgeEventRateLimitsPerEdge'
  | 'edgeUplinkMessagesRateLimits'
  | 'edgeUplinkMessagesRateLimitsPerEdge'
  | 'tenantEntityExportRateLimit'
  | 'tenantEntityImportRateLimit'
  | 'tenantNotificationRequestsPerRuleRateLimit'
  | 'tenantNotificationRequestsRateLimit'
  | 'tenantServerRestLimitsConfiguration'
  | 'transportDeviceMsgRateLimit'
  | 'transportDeviceTelemetryDataPointsRateLimit'
  | 'transportDeviceTelemetryMsgRateLimit'
  | 'transportGatewayDeviceMsgRateLimit'
  | 'transportGatewayDeviceTelemetryDataPointsRateLimit'
  | 'transportGatewayDeviceTelemetryMsgRateLimit'
  | 'transportGatewayMsgRateLimit'
  | 'transportGatewayTelemetryDataPointsRateLimit'
  | 'transportGatewayTelemetryMsgRateLimit'
  | 'transportTenantMsgRateLimit'
  | 'transportTenantTelemetryDataPointsRateLimit'
  | 'transportTenantTelemetryMsgRateLimit'
  | 'wsUpdatesPerSessionRateLimit';

/** 配置可来自旧版本，允许缺省字段；编辑时补齐已支持的默认值。 */
export type TenantProfileConfiguration = Partial<
  Record<TenantProfileNumericKey, number> &
    Record<TenantProfileRateLimitKey, string>
> & {
  [key: string]: unknown;
  smsEnabled?: boolean;
  type: 'DEFAULT';
};

/** 租户配置内的队列 id 为字符串，系统队列接口的 id 则是 EntityId。 */
export type TenantProfileQueue = Omit<Queue, 'id'> & { id?: string };

export interface TenantProfileData {
  [key: string]: unknown;
  configuration: TenantProfileConfiguration;
  queueConfiguration?: null | TenantProfileQueue[];
}

/** 租户配置实体(org.thingsboard.server.common.data.TenantProfile) */
export interface TenantProfile extends BaseData<EntityType.TENANT_PROFILE> {
  default?: boolean;
  description?: string;
  isolatedTbRuleEngine?: boolean;
  name: string;
  /** API 配额、速率限制和独立规则引擎队列。 */
  profileData?: TenantProfileData;
}

/** 租户配置详情(GET /api/tenantProfile/{tenantProfileId}) */
export function getTenantProfileById(tenantProfileId: string) {
  return requestClient.get<TenantProfile>(`/tenantProfile/${tenantProfileId}`);
}

/** 租户配置摘要(GET /api/tenantProfileInfo/{tenantProfileId}) */
export function getTenantProfileInfoById(tenantProfileId: string) {
  return requestClient.get<EntityInfo>(`/tenantProfileInfo/${tenantProfileId}`);
}

/** 默认租户配置摘要(GET /api/tenantProfileInfo/default) */
export function getDefaultTenantProfileInfo() {
  return requestClient.get<EntityInfo>('/tenantProfileInfo/default');
}

/** 保存租户配置(POST /api/tenantProfile,带 id 为更新) */
export function saveTenantProfile(tenantProfile: TenantProfile) {
  return requestClient.post<TenantProfile>('/tenantProfile', tenantProfile);
}

/** 删除租户配置(DELETE /api/tenantProfile/{tenantProfileId}) */
export function deleteTenantProfile(tenantProfileId: string): Promise<void> {
  return requestClient.delete(`/tenantProfile/${tenantProfileId}`);
}

/** 设为默认租户配置(POST /api/tenantProfile/{tenantProfileId}/default) */
export function setDefaultTenantProfile(tenantProfileId: string) {
  return requestClient.post<TenantProfile>(
    `/tenantProfile/${tenantProfileId}/default`,
  );
}

/** 租户配置分页列表(GET /api/tenantProfiles) */
export function getTenantProfiles(pageLink: PageLink) {
  return requestClient.get<PageData<TenantProfile>>('/tenantProfiles', {
    params: { ...pageLink },
  });
}

/** 租户配置摘要分页(下拉选择用,GET /api/tenantProfileInfos) */
export function getTenantProfileInfos(pageLink: PageLink) {
  return requestClient.get<PageData<EntityInfo>>('/tenantProfileInfos', {
    params: { ...pageLink },
  });
}
/**
 * 按 id 批量获取租户配置(GET /api/tenantProfiles/list?ids=a,b)
 */
export function getTenantProfileList(ids: string[]) {
  return requestClient.get<TenantProfile[]>('/tenantProfiles/list', {
    params: { ids: ids.join(',') },
  });
}

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteTenantProfiles(tenantProfileIds: string[]) {
  const ids = [...new Set(tenantProfileIds)];
  const results = await Promise.allSettled(
    ids.map((id) => deleteTenantProfile(id)),
  );
  const deletedIds: string[] = [];
  const failedIds: string[] = [];
  results.forEach((result, index) => {
    const id = ids[index];
    if (!id) return;
    (result.status === 'fulfilled' ? deletedIds : failedIds).push(id);
  });
  return { deletedIds, failedIds };
}
