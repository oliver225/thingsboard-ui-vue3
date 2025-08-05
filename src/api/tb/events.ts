import { BasicModel, EventQueryParam, Page } from '../model/baseModel';
import { EventType } from '/@/enums/eventEnum';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface EventInfo extends BasicModel<null> {
  tenantId?: EntityId<EntityType.TENANT>;
  type?: string;
  uid?: string;
  entityId?: EntityId<any>;
  body?: Recordable;
}

export interface EventFilter extends Recordable {
  eventType: EventType;
  server?: string;
  //统计类型STATS
  minMessagesProcessed?: number;
  maxMessagesProcessed?: number;
  minErrorsOccurred?: number;
  maxErrorsOccurred?: number;
  //生命周期事件LC_EVENT
  event?: string;
  status?: string;
  errorStr?: string;
  // 错误 ERROR
  method?: string;
  //errorStr?: string,
  //DEBUG_RULE_NODE 规则节点
  isError?: boolean;
  message?: string;
  msgDirectionType?: string;
  entityId?: string;
  entityType?: string;
  msgId?: string;
  msgType?: string;
  relationType?: string;
  dataSearch?: string;
  metadataSearch?: string;
}

export function getEvents(entityType: string, entityId: string, filter: EventFilter, params: EventQueryParam) {
  return defHttp.postJson<Page<EventInfo>>({
    url: `/api/events/${entityType}/${entityId}`,
    params: params,
    data: filter,
  });
}

export function getEventList(entityType: string, entityId: string, params: EventQueryParam) {
  return defHttp.get<Page<EventInfo>>({
    url: `/api/events/${entityType}/${entityId}`,
    params: params,
  });
}

export function clearEvents(
  entityType: string,
  entityId: string,
  params: { startTime: number; endTime: number },
  filter: EventFilter,
) {
  return defHttp.postJson<Page<EventInfo>>({
    url: `/api/events/${entityType}/${entityId}/clear`,
    params: params,
    data: filter,
  });
}
