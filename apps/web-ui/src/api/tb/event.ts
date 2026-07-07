import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

export enum EventType {
  DEBUG_CALCULATED_FIELD = 'DEBUG_CALCULATED_FIELD',
  DEBUG_RULE_CHAIN = 'DEBUG_RULE_CHAIN',
  DEBUG_RULE_NODE = 'DEBUG_RULE_NODE',
  ERROR = 'ERROR',
  LC_EVENT = 'LC_EVENT',
  STATS = 'STATS',
}

export enum DebugEventMsgDirectionType {
  IN = 'IN',
  OUT = 'OUT',
}

export type EventSortProperty = 'id' | 'ts';

export interface EventInfo extends BaseData<EntityType> {
  body?: Record<string, any>;
  entityId?: EntityId;
  tenantId?: EntityId<EntityType.TENANT>;
  type?: EventType | string;
  uid?: string;
}

export interface EventQuery extends PageLink {
  endTime?: number;
  startTime?: number;
  tenantId: string;
}

export interface EventTimeRangeQuery {
  endTime?: number;
  startTime?: number;
}

export interface BaseEventFilter {
  eventType: EventType | string;
  server?: string;
}

export interface ErrorEventFilter extends BaseEventFilter {
  errorStr?: string;
  eventType: EventType.ERROR;
  method?: string;
}

export interface LifeCycleEventFilter extends BaseEventFilter {
  errorStr?: string;
  event?: string;
  eventType: EventType.LC_EVENT;
  status?: string;
}

export interface StatisticsEventFilter extends BaseEventFilter {
  errorsOccurred?: number;
  eventType: EventType.STATS;
  messagesProcessed?: number;
}

export interface RuleDebugEventFilter extends BaseEventFilter {
  dataSearch?: string;
  entityId?: string;
  entityName?: string;
  errorStr?: string;
  isError?: boolean | string;
  metadataSearch?: string;
  msgDirectionType?: DebugEventMsgDirectionType | string;
  msgType?: string;
  relationType?: string;
}

export interface RuleNodeDebugEventFilter extends RuleDebugEventFilter {
  eventType: EventType.DEBUG_RULE_NODE;
}

export interface RuleChainDebugEventFilter extends RuleDebugEventFilter {
  eventType: EventType.DEBUG_RULE_CHAIN;
}

export interface CalculatedFieldDebugEventFilter extends BaseEventFilter {
  arguments?: string;
  entityId?: string;
  entityType?: EntityType | string;
  errorStr?: string;
  eventType: EventType.DEBUG_CALCULATED_FIELD;
  isError?: boolean | string;
  msgId?: string;
  msgType?: string;
  result?: string;
}

export type EventFilter =
  | CalculatedFieldDebugEventFilter
  | ErrorEventFilter
  | LifeCycleEventFilter
  | RuleChainDebugEventFilter
  | RuleNodeDebugEventFilter
  | StatisticsEventFilter;

/**
 * 获取实体事件(已废弃,后端仅返回生命周期事件)
 * GET /api/events/{entityType}/{entityId}
 */
export function getEvents(
  entityType: EntityType | string,
  entityId: string,
  params: EventQuery,
) {
  return requestClient.get<PageData<EventInfo>>(
    `/events/${entityType}/${entityId}`,
    { params },
  );
}

/**
 * 按事件过滤器获取实体事件
 * POST /api/events/{entityType}/{entityId}
 */
export function getEventsByFilter(
  entityType: EntityType | string,
  entityId: string,
  params: EventQuery,
  filter: EventFilter,
) {
  return requestClient.post<PageData<EventInfo>>(
    `/events/${entityType}/${entityId}`,
    filter,
    { params },
  );
}

/**
 * 按事件类型获取实体事件
 * GET /api/events/{entityType}/{entityId}/{eventType}
 */
export function getEventsByType(
  entityType: EntityType | string,
  entityId: string,
  eventType: EventType | string,
  params: EventQuery,
) {
  return requestClient.get<PageData<EventInfo>>(
    `/events/${entityType}/${entityId}/${eventType}`,
    { params },
  );
}

/**
 * 按事件过滤器清理实体事件
 * POST /api/events/{entityType}/{entityId}/clear
 */
export function clearEvents(
  entityType: EntityType | string,
  entityId: string,
  params: EventTimeRangeQuery,
  filter: EventFilter,
): Promise<void> {
  return requestClient.post(`/events/${entityType}/${entityId}/clear`, filter, {
    params,
  });
}
