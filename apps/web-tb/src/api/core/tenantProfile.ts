import type { Queue } from './queue';

import type { BasicQuery, EntityInfo, Page } from '#/api/model';
import type { EntityType } from '#/constants';
import type { EntityId } from '#/types';

import { requestClient } from '#/api/request';

export interface Configuration {
  type: 'DEFAULT';

  maxDevices: number;
  maxDashboards: number;
  maxAssets: number;
  maxUsers: number;
  maxCustomers: number;
  maxRuleChains: number;
  // maxEdges: number;

  maxREExecutions: number;
  maxTransportMessages: number;
  maxJSExecutions: number;
  maxTbelExecutions: number;
  maxRuleNodeExecutionsPerMessage: number;
  maxTransportDataPoints: number;

  maxDPStorageDays: number;
  alarmsTtlDays: number;
  defaultStorageTtlDays: number;
  rpcTtlDays: number;
  queueStatsTtlDays: 0;
  ruleEngineExceptionsTtlDays: 0;

  smsEnabled?: boolean;
  maxSms: number;
  maxEmails: number;
  maxCreatedAlarms: number;

  maxResourceSize: number;
  maxOtaPackagesInBytes: number;
  maxResourcesInBytes: number;

  maxWsSessionsPerTenant: number;
  maxWsSubscriptionsPerTenant: number;
  maxWsSessionsPerCustomer: number;
  maxWsSubscriptionsPerCustomer: number;
  maxWsSessionsPerPublicUser: number;
  maxWsSubscriptionsPerPublicUser: number;
  maxWsSessionsPerRegularUser: number;
  maxWsSubscriptionsPerRegularUser: number;
  wsMsgQueueLimitPerSession: number;

  // maxCalculatedFieldsPerEntity: number;
  // maxArgumentsPerCF: number;
  // maxDataPointsPerRollingArg: number;
  // maxStateSizeInKBytes: number;
  // maxSingleValueArgumentSizeInKBytes: number;
  // warnThreshold: number;
  // maxDebugModeDurationMinutes: number;

  transportTenantMsgRateLimit?: string;
  transportDeviceMsgRateLimit?: string;
  transportTenantTelemetryMsgRateLimit?: string;
  transportDeviceTelemetryMsgRateLimit?: string;
  transportGatewayMsgRateLimit?: string;
  transportGatewayDeviceMsgRateLimit?: string;
  transportGatewayTelemetryMsgRateLimit?: string;
  transportGatewayDeviceTelemetryMsgRateLimit?: string;

  transportTenantTelemetryDataPointsRateLimit?: string;
  transportDeviceTelemetryDataPointsRateLimit?: string;
  transportGatewayTelemetryDataPointsRateLimit?: string;
  transportGatewayDeviceTelemetryDataPointsRateLimit?: string;
  tenantServerRestLimitsConfiguration?: string;
  customerServerRestLimitsConfiguration?: string;
  tenantEntityImportRateLimit?: string;
  tenantEntityExportRateLimit?: string;
  wsUpdatesPerSessionRateLimit?: string;
  cassandraQueryTenantRateLimitsConfiguration?: string;
  tenantNotificationRequestsRateLimit?: string;
  tenantNotificationRequestsPerRuleRateLimit?: string;
  edgeEventRateLimits?: string;
  edgeEventRateLimitsPerEdge?: string;
  edgeUplinkMessagesRateLimits?: string;
  edgeUplinkMessagesRateLimitsPerEdge?: string;
}

export interface TenantProfile {
  id: EntityId<EntityType.TENANT_PROFILE>;
  name?: string;
  description?: string;
  default?: boolean;
  isolatedTbRuleEngine?: boolean;
  profileData: {
    configuration: Configuration;
    queueConfiguration?: [any | Queue];
  };
  createdTime?: number;
}

export function getTenantProfileInfoByIdApi(tenantProfileId: string) {
  return requestClient.get<EntityInfo<EntityType.TENANT_PROFILE>>(
    `/tenantProfileInfo/${tenantProfileId}`,
  );
}

export function getTenantProfileByIdApi(tenantProfileId: string) {
  return requestClient.get<TenantProfile>(`/tenantProfile/${tenantProfileId}`);
}

export function getDefaultTenantProfileInfoApi() {
  return requestClient.get<EntityInfo<EntityType.TENANT_PROFILE>>(
    '/tenantProfileInfo/default',
  );
}

export function tenantProfileInfoListApi(params: BasicQuery) {
  return requestClient.get<Page<EntityInfo<EntityType.TENANT_PROFILE>>>(
    '/tenantProfileInfos',
    { params },
  );
}

export function tenantProfileListApi(params: BasicQuery) {
  return requestClient.get<Page<TenantProfile>>('/tenantProfiles', { params });
}

export function getTenantProfilesByIdsApi(ids: [string]) {
  return requestClient.get<Array<TenantProfile>>('/tenantProfiles', {
    params: { ids },
  });
}

export function saveTenantProfileApi(data: any | TenantProfile) {
  return requestClient.post<TenantProfile>('/tenantProfile', data);
}

export function setTenantProfileDefaultApi(tenantProfileId: string) {
  return requestClient.post(`/tenantProfile/${tenantProfileId}/default`);
}

export function deleteTenantProfileApi(tenantProfileId: string) {
  return requestClient.delete(`/tenantProfile/${tenantProfileId}`);
}
