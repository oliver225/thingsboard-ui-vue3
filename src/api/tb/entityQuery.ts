import { Page } from '../model/baseModel';
import {
  AlarmCountQuery,
  AlarmData,
  AlarmDataQuery,
  EntityCountQuery,
  EntityData,
  EntityDataQuery,
} from '../model/entityQuery';
import { Scope } from '/@/enums/telemetryEnum';
import { defHttp } from '/@/utils/http/axios';

export function countEntitiesByQuery(query: EntityCountQuery | any) {
  return defHttp.postJson<number>({
    url: '/api/entitiesQuery/count',
    data: query,
  });
}

export function findEntityDataByQuery(query: EntityDataQuery | any) {
  return defHttp.postJson<Page<EntityData>>({
    url: '/api/entitiesQuery/find',
    data: query,
  });
}

export function countAlarmsByQuery(query: AlarmCountQuery | any) {
  return defHttp.postJson<number>({
    url: '/api/alarmsQuery/count',
    data: query,
  });
}

export function findAlarmDataByQuery(query: AlarmDataQuery | any) {
  return defHttp.postJson<Page<AlarmData>>({
    url: '/api/alarmsQuery/find',
    data: query,
  });
}

interface EntityKeyQuery {
  attributes: boolean;
  timeseries: boolean;
  scope: Scope;
}

export function findEntityKeyByQuery(params: EntityKeyQuery, data: any) {
  return defHttp.postJson({
    url: '/api/entitiesQuery/find/keys',
    data,
    params,
  });
}
