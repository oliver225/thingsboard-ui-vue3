import { BasicModel, DeviceQueryParam, EntitySubtype, Page, RelationsSearchParameters } from '../model/baseModel';
import { CredentialsType, TransportType } from '/@/enums/deviceEnum';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface Device extends BasicModel<EntityType.DEVICE> {
  name?: string;
  type?: string;
  label?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  customerId?: EntityId<EntityType.CUSTOMER>;
  deviceProfileId?: EntityId<EntityType.DEVICE_PROFILE>;
  externalId?: EntityId<EntityType.DEVICE>;
  firmwareId?: EntityId<EntityType.OTA_PACKAGE>;
  softwareId?: EntityId<EntityType.OTA_PACKAGE>;
  deviceData?: {
    configuration?: { type: 'DEFAULT' };
    transportConfiguration?: { type: TransportType };
    thingModelDefine: { properties?: []; services?: []; events?: [] };
  };
  additionalInfo: { description?: string; gateway: boolean; overwriteActivityTime?: boolean };
}

export interface DeviceInfo extends Device {
  customerTitle?: string;
  customerIsPublic?: boolean;
  deviceProfileName?: string;
  active?: boolean;
}

export interface DeviceCredentials extends BasicModel<null> {
  deviceId: EntityId<EntityType.DEVICE>;
  credentialsType: CredentialsType;
  credentialsId: string;
  credentialsValue: string;
}

export interface DeviceSearchQuery {
  parameters?: RelationsSearchParameters;
  relationType?: string;
  deviceTypes?: Array<string>;
}

export function getDeviceById(deviceId: string) {
  return defHttp.get<Device>({
    url: `/api/device/${deviceId}`,
  });
}
export function getDeviceInfoById(deviceId: string) {
  return defHttp.get<DeviceInfo>({
    url: `/api/device/info/${deviceId}`,
  });
}

export function saveDevice(data: Device | any, accessToken?: string) {
  return defHttp.postJson<Device>({
    url: '/api/device',
    data,
    params: accessToken ? { accessToken: accessToken } : null,
  });
}

export function saveDeviceWithCredentials(data: { device: Device; credentials: DeviceCredentials } | any) {
  return defHttp.postJson<Device>({
    url: '/api/device-with-credentials',
    data,
  });
}

export function deleteDevice(deviceId: string) {
  return defHttp.delete<void>({
    url: `/api/device/${deviceId}`,
  });
}

export function assignDeviceToCustomer(customerId: string, deviceId: string) {
  return defHttp.post<Device>({
    url: `/api/customer/${customerId}/device/${deviceId}`,
  });
}

export function assignDeviceToPublicCustomer(deviceId: string) {
  return defHttp.post<Device>({
    url: `/api/customer/public/device/${deviceId}`,
  });
}

export function unAssignDeviceFromCustomer(deviceId: string) {
  return defHttp.delete<void>({
    url: `/api/customer/device/${deviceId}`,
  });
}

export function assignDeviceToTenant(tenantId: string, deviceId: string) {
  return defHttp.post<Device>({
    url: `/api/tenant/${tenantId}/device/${deviceId}`,
  });
}

export function assignDeviceToEdge(edgeId: string, deviceId: string) {
  return defHttp.post<Device>({
    url: `/api/edge/${edgeId}/device/${deviceId}`,
  });
}

export function unAssignDeviceFromEdge(edgeId: string, deviceId: string) {
  return defHttp.delete<void>({
    url: `/api/edge/${edgeId}/device/${deviceId}`,
  });
}

export function getDeviceCredentialsByDeviceId(deviceId: string) {
  return defHttp.get<DeviceCredentials>({
    url: `/api/device/${deviceId}/credentials`,
  });
}

export function updateDeviceCredentials(data: DeviceCredentials | any) {
  return defHttp.postJson<DeviceCredentials>({
    url: '/api/device/credentials',
    data,
  });
}

export function getTenantDeviceInfoList(params: DeviceQueryParam) {
  return defHttp.get<Page<DeviceInfo>>({
    url: '/api/tenant/deviceInfos',
    params,
  });
}

export function getTenantDeviceList(params: DeviceQueryParam) {
  return defHttp.get<Page<Device>>({
    url: '/api/tenant/devices',
    params,
  });
}

export function getCustomerDeviceList(params: DeviceQueryParam, customerId: string) {
  return defHttp.get<Page<Device>>({
    url: `/api/customer/${customerId}/devices`,
    params,
  });
}

export function getCustomerDeviceInfoList(params: DeviceQueryParam, customerId: string) {
  return defHttp.get<Page<DeviceInfo>>({
    url: `/api/customer/${customerId}/deviceInfos`,
    params,
  });
}

export function getEdgeDeviceInfoList(params: DeviceQueryParam, edgeId: string) {
  return defHttp.get<Page<DeviceInfo>>({
    url: `/api/edge/${edgeId}/devices`,
    params,
  });
}

export function getDevicesByIds(deviceIds: string[]) {
  return defHttp.get<Array<Device>>({
    url: '/api/devices',
    params: { deviceIds: deviceIds },
  });
}

export function getDeviceListByQuery(data: DeviceSearchQuery | any) {
  return defHttp.postJson<Array<Device>>({
    url: '/api/devices',
    data,
  });
}

export function getDeviceTypes() {
  return defHttp.get<Array<EntitySubtype>>({
    url: '/api/device/types',
  });
}

export function claimDevice(deviceName: string, secretKey: string) {
  return defHttp.postJson<any>({
    url: `/api/customer/device/${deviceName}/claim`,
    data: { secretKey: secretKey },
  });
}

export function reClaimDevice(deviceName: string) {
  return defHttp.delete<void>({
    url: `/api/customer/device/${deviceName}/claim`,
  });
}

export function countByDeviceProfileAndEmptyOtaPackage(otaPackageType: string, deviceProfileId: string) {
  return defHttp.get<number>({
    url: `/api/devices/count/${otaPackageType}/${deviceProfileId}`,
  });
}

//TODO 没有写
export function processDevicesBulkImport() {}
