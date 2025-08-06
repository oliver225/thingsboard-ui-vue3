import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { AlarmSeverity } from '/@/enums/alarmEnum';
import { ProvisionType, TransportType } from '/@/enums/deviceEnum';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface DynamicValue {
  sourceType: 'CURRENT_TENANT' | 'CURRENT_CUSTOMER' | 'CURRENT_USER' | 'CURRENT_DEVICE';
  sourceAttribute: string;
  inherit: boolean;
}

export interface EntityKey {
  type: 'ATTRIBUTE' | 'TIME_SERIES' | 'ENTITY_FIELD' | 'CONSTANT';
  key?: string;
}

export interface Predicate {
  type: 'STRING' | 'NUMERIC' | 'BOOLEAN' | 'COMPLEX';
  //STRING
  operation: 'EQUAL' | 'NOT_EQUAL' | 'STARTS_WITH' | 'ENDS_WITH' | 'CONTAINS' | 'NOT_CONTAINS' | 'IN' | 'NOT_IN';
  ignoreCase: boolean;
  value: { defaultValue: any; userValue: object; dynamicValue: DynamicValue };
  //NUMERIC
  //operation: 'EQUAL' | 'NOT_EQUAL' | 'GREATER' | 'LESS' | 'GREATER_OR_EQUAL' | 'LESS_OR_EQUAL';
  //BOOLEAN
  //operation: 'EQUAL' | 'NOT_EQUAL';
  //COMPLEX
  predicates: Predicate;
}

export interface Spec {
  type: 'SIMPLE' | 'DURATION' | 'REPEATING';
  unit?: 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS';
  predicate?: { defaultValue: number };
}

export interface ConditionItem {
  key: EntityKey;
  valueType: 'STRING' | 'NUMERIC' | 'BOOLEAN' | 'DATE_TIME';
  value?: object;
  predicate: Predicate;
}

export interface Condition {
  condition: Array<ConditionItem>;
  spec: Spec;
}
export interface Schedule {
  type: 'ANY_TIME' | 'SPECIFIC_TIME' | 'CUSTOM';
  dynamicValue?: DynamicValue;
  timezone: 'Asia/Shanghai';
  //SPECIFIC_TIME
  daysOfWeek?: [1 | 2 | 3 | 4 | 5 | 6 | 7];
  startsOn?: any;
  endsOn?: any;
  //CUSTOM
  items: Array<{
    enabled: boolean;
    dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    startsOn: any;
    endsOn: any;
  }>;
}

export interface AlarmRule {
  condition: Condition;
  schedule: Schedule;
  alarmDetails?: string;
  dashboardId?: EntityId<EntityType.DASHBOARD>;
}

export interface Alarm {
  id: string;
  alarmType?: string;
  createRules?: Record<AlarmSeverity, AlarmRule>;
  createRulesList?: Array<any>;
  clearRule?: AlarmRule;
  propagate?: boolean;
  propagateToOwner?: boolean;
  propagateToTenant?: boolean;
  propagateRelationTypes?: [string];
}

export interface DeviceProfile extends BasicModel<EntityType.DEVICE_PROFILE> {
  tenantId?: EntityId<EntityType.TENANT>;
  name?: string;
  type?: 'DEFAULT';
  image?: string;
  description?: string;
  default?: boolean;
  defaultQueueName?: string;
  defaultDashboardId?: EntityId<EntityType.DASHBOARD>;
  defaultRuleChainId?: EntityId<EntityType.RULE_CHAIN>;
  defaultEdgeRuleChainId?: EntityId<EntityType.RULE_CHAIN>;

  transportType?: TransportType;
  provisionDeviceKey?: string;
  provisionType?: ProvisionType;
  firmwareId?: EntityId<EntityType.OTA_PACKAGE>;
  softwareId?: EntityId<EntityType.OTA_PACKAGE>;
  externalId?: EntityId<EntityType.DEVICE_PROFILE>;
  profileData?: {
    configuration?: { type: 'DEFAULT' };
    transportConfiguration?: { type: TransportType };
    thingModelDefine: { properties?: []; services?: []; events?: [] };
    provisionConfiguration?: { type: ProvisionType };
    alarms: [Alarm] | undefined;
  };
  searchText?: string;
}
export interface DeviceProfileInfo {
  tenantId?: EntityId<EntityType.TENANT>;
  id?: EntityId<EntityType.DEVICE_PROFILE>;
  type?: 'DEFAULT';
  name?: string;
  image?: string;
  transportType?: TransportType;
  defaultDashboardId?: EntityId<EntityType.DASHBOARD>;
}

// export interface Function {
//   type?: 'property' | 'service' | 'event';
//   name?: string;
//   identifier?: string;
//   accessMode?: 'r' | 'rw';
//   dataType?: {
//     type?: DataType;
//     specs?: {
//       min?: number;
//       max: number;
//       step?: number;
//       unit?: string;
//       unitName?: string;
//       length?: number;
//       size?: number;
//     };
//   };
//   desc?: '';
//   outputData?: Array<Function>;
//   inputData?: Array<Function>;
//   callType: 'async' | 'sync';
// }

export function getDeviceProfileById(deviceProfileId: string) {
  return defHttp.get<DeviceProfile>({
    url: `/api/deviceProfile/${deviceProfileId}`,
  });
}

export function getDeviceProfileInfoById(deviceProfileId: string) {
  return defHttp.get<DeviceProfileInfo>({
    url: `/api/deviceProfileInfo/${deviceProfileId}`,
  });
}

export function getDefaultDeviceProfileInfo() {
  return defHttp.get<DeviceProfileInfo>({
    url: '/api/deviceProfileInfo/default',
  });
}

export function setDefaultDeviceProfile(deviceProfileId?: string) {
  return defHttp.post<DeviceProfile>({
    url: `/api/deviceProfile/${deviceProfileId}/default`,
  });
}

export function deviceProfileList(params: BasicQuery) {
  return defHttp.get<Page<DeviceProfile>>({
    url: '/api/deviceProfiles',
    params,
  });
}

export function getDeviceProfileInfoList(params: BasicQuery, transportType?: TransportType) {
  return defHttp.get<Page<DeviceProfileInfo>>({
    url: '/api/deviceProfileInfos',
    params: { ...params, transportType: transportType },
  });
}

export function saveDeviceProfile(data: DeviceProfile | any) {
  return defHttp.postJson<DeviceProfile>({
    url: '/api/deviceProfile',
    data,
  });
}

export function deleteDeviceProfile(deviceProfileId?: string) {
  return defHttp.delete<void>({
    url: `/api/deviceProfile/${deviceProfileId}`,
  });
}

export function getTimeseriesKeys(deviceProfileId?: string) {
  return defHttp.get<[string]>({
    url: '/api/deviceProfile/devices/keys/timeseries',
    params: { deviceProfileId: deviceProfileId },
  });
}

export function getAttributesKeys(deviceProfileId?: string) {
  return defHttp.get<[string]>({
    url: '/api/deviceProfile/devices/keys/attributes',
    params: { deviceProfileId: deviceProfileId },
  });
}
