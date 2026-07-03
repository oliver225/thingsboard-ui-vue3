/**
 * 设备配置接口(TENANT_ADMIN)
 * 契约参考:后端 DeviceProfileController.java
 * 注:设备配置下拉摘要(DeviceProfileInfo/getDeviceProfileInfos)在 api/tb/device.ts。
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 设备配置实体(org.thingsboard.server.common.data.DeviceProfile) */
export interface DeviceProfile extends BaseData<EntityType.DEVICE_PROFILE> {
  default?: boolean;
  defaultDashboardId?: EntityId<EntityType.DASHBOARD>;
  defaultQueueName?: string;
  defaultRuleChainId?: EntityId<EntityType.RULE_CHAIN>;
  description?: string;
  image?: string;
  name: string;
  /** 配置数据(transport/provision/alarms 等),详见 DeviceProfileData */
  profileData?: Record<string, any>;
  provisionDeviceKey?: string;
  /** 配置策略(DISABLED/ALLOW_CREATE_NEW_DEVICES/CHECK_PRE_PROVISIONED_DEVICES) */
  provisionType?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  /** 传输类型(DEFAULT/MQTT/COAP/LWM2M/SNMP) */
  transportType?: string;
  /** 配置类型,目前恒为 DEFAULT */
  type?: string;
}

/** 设备配置摘要(DeviceProfileInfo,下拉选择用) */
export interface DeviceProfileInfo {
  defaultDashboardId?: EntityId<EntityType.DASHBOARD>;
  id: EntityId<EntityType.DEVICE_PROFILE>;
  image?: string;
  name: string;
  tenantId?: EntityId<EntityType.TENANT>;
  transportType?: string;
  type?: string;
}

/** 设备配置分页列表(GET /api/deviceProfiles) */
export function getDeviceProfiles(pageLink: PageLink) {
  return requestClient.get<PageData<DeviceProfile>>('/deviceProfiles', {
    params: { ...pageLink },
  });
}

/** 设备配置详情(GET /api/deviceProfile/{deviceProfileId}) */
export function getDeviceProfileById(deviceProfileId: string) {
  return requestClient.get<DeviceProfile>(`/deviceProfile/${deviceProfileId}`);
}

/** 保存设备配置(POST /api/deviceProfile,带 id 为更新) */
export function saveDeviceProfile(deviceProfile: DeviceProfile) {
  return requestClient.post<DeviceProfile>('/deviceProfile', deviceProfile);
}

/** 删除设备配置(DELETE /api/deviceProfile/{deviceProfileId}) */
export function deleteDeviceProfile(deviceProfileId: string): Promise<void> {
  return requestClient.delete(`/deviceProfile/${deviceProfileId}`);
}

/** 设为默认设备配置(POST /api/deviceProfile/{deviceProfileId}/default) */
export function setDefaultDeviceProfile(deviceProfileId: string) {
  return requestClient.post<DeviceProfile>(
    `/deviceProfile/${deviceProfileId}/default`,
  );
}

/** 设备配置下拉分页(GET /api/deviceProfileInfos) */
export function getDeviceProfileInfos(pageLink: PageLink) {
  return requestClient.get<PageData<DeviceProfileInfo>>('/deviceProfileInfos', {
    params: { ...pageLink },
  });
}
