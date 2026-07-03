/**
 * 设备接口
 * 契约参考:后端 DeviceController.java / DeviceProfileController.java
 */
import type { DeviceCredentialsType, EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 设备凭证(org.thingsboard.server.common.data.security.DeviceCredentials) */
export interface DeviceCredentials {
  createdTime?: number;
  /** ACCESS_TOKEN:令牌值;X509:证书 sha3 哈希(只读) */
  credentialsId?: string;
  credentialsType: DeviceCredentialsType;
  /** X509:PEM 证书;MQTT_BASIC:JSON 字符串 {clientId,userName,password} */
  credentialsValue?: string;
  deviceId?: EntityId<EntityType.DEVICE>;
  id?: { id: string };
}

/** 批量导入请求(BulkImportRequest) */
export interface DeviceBulkImportRequest {
  file: string;
  mapping: {
    columns: Array<{ key?: string; type: string }>;
    delimiter: string;
    header: boolean;
    update: boolean;
  };
}

/** 批量导入结果(BulkImportResult) */
export interface DeviceBulkImportResult {
  created: number;
  errors: number;
  errorsList?: string[];
  updated: number;
}

/** 设备实体(org.thingsboard.server.common.data.Device) */
export interface Device extends BaseData<EntityType.DEVICE> {
  additionalInfo?: {
    [key: string]: any;
    description?: string;
    gateway?: boolean;
    overwriteActivityTime?: boolean;
  };
  customerId?: EntityId<EntityType.CUSTOMER>;
  deviceProfileId?: EntityId<EntityType.DEVICE_PROFILE>;
  label?: string;
  name: string;
  tenantId?: EntityId<EntityType.TENANT>;
  /** @deprecated 由 deviceProfile 取代,后端仍返回 */
  type?: string;
}

/** 设备信息(DeviceInfo extends Device,列表展示用) */
export interface DeviceInfo extends Device {
  active: boolean;
  customerIsPublic?: boolean;
  customerTitle?: string;
  deviceProfileName?: string;
}

export interface DeviceQueryParams extends PageLink {
  type?: string;
  deviceProfileId?: string;
  active?: boolean;
}

/** 租户设备分页列表(GET /api/tenant/deviceInfos) */
export function getTenantDeviceInfos(params: DeviceQueryParams) {
  return requestClient.get<PageData<DeviceInfo>>('/tenant/deviceInfos', {
    params,
  });
}

/** 客户设备分页列表(GET /api/customer/{customerId}/deviceInfos) */
export function getCustomerDeviceInfos(
  customerId: string,
  params: DeviceQueryParams,
) {
  return requestClient.get<PageData<DeviceInfo>>(
    `/customer/${customerId}/deviceInfos`,
    {
      params,
    },
  );
}

/** 设备详情(GET /api/device/{deviceId}) */
export function getDeviceById(deviceId: string) {
  return requestClient.get<Device>(`/device/${deviceId}`);
}

/** 设备信息详情(GET /api/device/info/{deviceId}) */
export function getDeviceInfoById(deviceId: string) {
  return requestClient.get<DeviceInfo>(`/device/info/${deviceId}`);
}

/** 保存设备(POST /api/device,带 id 为更新) */
export function saveDevice(device: Device) {
  return requestClient.post<Device>('/device', device);
}

/** 保存设备及凭证(POST /api/device-with-credentials) */
export function saveDeviceWithCredentials(
  device: Device,
  credentials: DeviceCredentials,
) {
  return requestClient.post<Device>('/device-with-credentials', {
    credentials,
    device,
  });
}

/** 删除设备(DELETE /api/device/{deviceId}) */
export function deleteDevice(deviceId: string): Promise<void> {
  return requestClient.delete(`/device/${deviceId}`);
}

/** 分配设备给客户(POST /api/customer/{customerId}/device/{deviceId}) */
export function assignDeviceToCustomer(customerId: string, deviceId: string) {
  return requestClient.post<Device>(
    `/customer/${customerId}/device/${deviceId}`,
  );
}

/** 取消分配(DELETE /api/customer/device/{deviceId});设为私有同样走此接口 */
export function unassignDeviceFromCustomer(deviceId: string) {
  return requestClient.delete<Device>(`/customer/device/${deviceId}`);
}

/** 设为公开(分配给公共客户,POST /api/customer/public/device/{deviceId}) */
export function makeDevicePublic(deviceId: string) {
  return requestClient.post<Device>(`/customer/public/device/${deviceId}`);
}

/** 获取设备凭证(GET /api/device/{deviceId}/credentials) */
export function getDeviceCredentials(deviceId: string) {
  return requestClient.get<DeviceCredentials>(
    `/device/${deviceId}/credentials`,
  );
}

/** 保存设备凭证(POST /api/device/credentials) */
export function saveDeviceCredentials(credentials: DeviceCredentials) {
  return requestClient.post<DeviceCredentials>(
    '/device/credentials',
    credentials,
  );
}

/** 批量导入设备(POST /api/device/bulk_import) */
export function bulkImportDevices(request: DeviceBulkImportRequest) {
  return requestClient.post<DeviceBulkImportResult>(
    '/device/bulk_import',
    request,
  );
}
