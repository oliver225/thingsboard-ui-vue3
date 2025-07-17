import { BasicModel, BasicQuery, EntityInfo, Page } from '../model/baseModel';
import { Queue } from './queue';
import { EntityType } from '/@/enums/entityTypeEnum';
import { defHttp } from '/@/utils/http/axios';

export interface TenantProfileConfiguration {
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

export interface TenantProfile extends BasicModel<EntityType.TENANT_PROFILE> {
  name?: string;
  description?: string;
  default?: boolean;
  isolatedTbRuleEngine?: boolean;
  profileData: {
    configuration: TenantProfileConfiguration;
    queueConfiguration?: [Queue | any];
  };
}

export function getTenantProfileInfoById(tenantProfileId: string) {
  return defHttp.get<EntityInfo<EntityType.TENANT_PROFILE>>({
    url: `/tenantProfileInfo/${tenantProfileId}`,
  });
}

export function getTenantProfileInfoDefault() {
  return defHttp.get<EntityInfo<EntityType.TENANT_PROFILE>>({
    url: '/tenantProfileInfo/default',
  });
}

export function tenantProfileInfoList(params: BasicQuery) {
  return defHttp.get<Page<EntityInfo<EntityType.TENANT_PROFILE>>>({
    url: '/tenantProfileInfos',
    params,
  });
}

export function saveTenantProfile(data: TenantProfile | any) {
  return defHttp.postJson<TenantProfile>({
    url: '/tenantProfile',
    data,
  });
}

export function setTenantProfileDefault(tenantProfileId: string) {
  return defHttp.post<TenantProfile>({
    url: `/tenantProfile/${tenantProfileId}/default`,
  });
}

export function getTenantProfileById(tenantProfileId: string) {
  return defHttp.get<TenantProfile>({
    url: `/tenantProfile/${tenantProfileId}`,
  });
}

export function tenantProfiles(ids: [string]) {
  return defHttp.get<[TenantProfile]>({
    url: '/tenantProfiles',
    params: { ids },
  });
}

export function tenantProfileList(params: BasicQuery) {
  return defHttp.get<Page<TenantProfile>>({
    url: '/tenantProfiles',
    params,
  });
}

export function deleteTenantProfile(tenantProfileId: string) {
  return defHttp.delete<void>({
    url: `/tenantProfile/${tenantProfileId}`,
  });
}
