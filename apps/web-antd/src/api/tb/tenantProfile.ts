import type { EntityId, EntityType } from '@vben/constants';

import type { QueueApi } from './queue';

import type { BasicQuery, EntityInfo, Page } from '#/api/model';

import { requestClient } from '#/api/request';

export namespace TenantProfileApi {
  export interface Configuration {
    type: string;

    maxDevices?: number;
    maxAssets?: number;
    maxCustomers?: number;
    maxUsers?: number;
    maxDashboards?: number;
    maxRuleChains?: number;
    maxResourcesInBytes?: number;
    maxOtaPackagesInBytes?: number;

    transportTenantMsgRateLimit?: string;
    transportTenantTelemetryMsgRateLimit?: string;
    transportTenantTelemetryDataPointsRateLimit?: string;
    transportDeviceMsgRateLimit?: string;
    transportDeviceTelemetryMsgRateLimit?: string;
    transportDeviceTelemetryDataPointsRateLimit?: string;

    tenantEntityExportRateLimit?: string;
    tenantEntityImportRateLimit?: string;
    tenantNotificationRequestsRateLimit?: string;
    tenantNotificationRequestsPerRuleRateLimit?: string;

    maxTransportMessages?: number;
    maxTransportDataPoints?: number;
    maxREExecutions?: number;
    maxJSExecutions?: number;
    maxDPStorageDays?: number;
    maxRuleNodeExecutionsPerMessage?: number;
    maxEmails?: number;
    maxSms?: number;
    maxCreatedAlarms?: number;

    tenantServerRestLimitsConfiguration?: string;
    customerServerRestLimitsConfiguration?: string;

    maxWsSessionsPerTenant?: number;
    maxWsSessionsPerCustomer?: number;
    maxWsSessionsPerRegularUser?: number;
    maxWsSessionsPerPublicUser?: number;
    wsMsgQueueLimitPerSession?: number;
    maxWsSubscriptionsPerTenant?: number;
    maxWsSubscriptionsPerCustomer?: number;
    maxWsSubscriptionsPerRegularUser?: number;
    maxWsSubscriptionsPerPublicUser?: number;
    wsUpdatesPerSessionRateLimit?: string;

    cassandraQueryTenantRateLimitsConfiguration?: string;

    defaultStorageTtlDays?: number;
    alarmsTtlDays?: number;
    rpcTtlDays?: number;

    warnThreshold?: number;
  }

  export interface TenantProfile {
    id: EntityId<EntityType.TENANT_PROFILE>;
    name?: string;
    description?: string;
    default?: boolean;
    isolatedTbRuleEngine?: boolean;
    profileData: {
      configuration: Configuration;
      queueConfiguration?: [any | QueueApi.Queue];
    };
    createdTime?: number;
  }
}

export function getTenantProfileInfoByIdApi(tenantProfileId: string) {
  return requestClient.get<EntityInfo<EntityType.TENANT_PROFILE>>(
    `/tenantProfileInfo/${tenantProfileId}`,
  );
}

export function getTenantProfileByIdApi(tenantProfileId: string) {
  return requestClient.get<TenantProfileApi.TenantProfile>(
    `/tenantProfile/${tenantProfileId}`,
  );
}

export function getDefaultTenantProfileInfoApi() {
  return requestClient.get<EntityInfo<EntityType.TENANT_PROFILE>>(
    '/tenantProfileInfo/default',
  );
}

export function tenantProfileInfoListApi(params: BasicQuery) {
  return requestClient.get<Page<EntityInfo<EntityType.TENANT_PROFILE>>>(
    '/tenantProfileInfos',
    params,
  );
}

export function tenantProfileListApi(params: BasicQuery) {
  return requestClient.get<Page<TenantProfileApi.TenantProfile>>(
    '/tenantProfiles',
    params,
  );
}

export function getTenantProfilesByIdsApi(ids: [string]) {
  return requestClient.get<Array<TenantProfileApi.TenantProfile>>(
    '/tenantProfiles',
    { ids },
  );
}

export function saveTenantProfileApi(
  data: any | TenantProfileApi.TenantProfile,
) {
  return requestClient.post<TenantProfileApi.TenantProfile>(
    '/tenantProfile',
    data,
  );
}

export function setTenantProfileDefaultApi(tenantProfileId: string) {
  return requestClient.post<TenantProfileApi.TenantProfile>(
    `/tenantProfile/${tenantProfileId}/default`,
  );
}

export function deleteTenantProfileApi(tenantProfileId: string) {
  return requestClient.delete(`/tenantProfile/${tenantProfileId}`);
}
