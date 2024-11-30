import { BasicQuery, Page } from '../model/baseModel';
import { EntityId } from '/#/store';
import { EntityType } from '/@/enums/entityTypeEnum';
import { DataType, FunctionType } from '/@/enums/thingsModelEnum';
import { defHttp } from '/@/utils/http/axios';

export interface Function extends Recordable {
  identifier?: string;
  name?: string;
  type?: FunctionType;
  deviceProfileId?: EntityId<EntityType.DEVICE_PROFILE>;
  tenantId: EntityId<EntityType.TENANT>;
  description?: string;
}

export interface Property extends Function {
  type: FunctionType.property;
  accessMode?: 'rw' | 'r';
  dataType?: {
    type?: DataType;
    specs?: {
      min?: number;
      max?: number;
      step?: number;
      unit?: number;
      unitName?: string;
      length?: number;
    };
  };
}

export interface Service extends Function {
  type: FunctionType.service;
  callType?: 'async' | 'sync';
  outputData: Property[];
  inputData: Property[];
}

export interface Event extends Function {
  type: FunctionType.event;
  outputData: Property[];
}

export function saveFunction(data?: Function | any) {
  if (data.type == FunctionType.service) {
    return saveService(data);
  } else if (data.type == FunctionType.event) {
    return saveEvent(data);
  } else if (data.type == FunctionType.property) {
    return saveProperty(data);
  }
}

export function saveProperty(data?: Property | any) {
  return defHttp.postJson<Property>({
    url: '/api/thingsModel/property',
    data,
  });
}

export function saveService(data?: Service | any) {
  return defHttp.postJson<Service>({
    url: '/api/thingsModel/service',
    data,
  });
}
export function saveEvent(data?: Event | any) {
  return defHttp.postJson<Event>({
    url: '/api/thingsModel/event',
    data,
  });
}

export function getFunction(deviceProfileId: string, identifier: string) {
  return defHttp.get<Function>({
    url: `/api/thingsModel/${deviceProfileId}/${identifier}`,
  });
}

export function deleteFunction(deviceProfileId: string, identifier: string) {
  return defHttp.delete<void>({
    url: `/api/thingsModel/${deviceProfileId}/${identifier}`,
  });
}

export function functionList(
  deviceProfileId: string,
  params: {
    pageSize: number;
    page: number;
    textSearch?: string;
    sortProperty?: string;
    sortOrder?: 'ASC' | 'DESC';
    type?: FunctionType;
  },
) {
  return defHttp.get<Page<Function>>({
    url: `/api/thingsModel/${deviceProfileId}/functions`,
    params,
  });
}
