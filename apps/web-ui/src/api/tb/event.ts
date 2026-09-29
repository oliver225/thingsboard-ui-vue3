import type { EntityType } from '#/enums';
import type { EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 对应后端 EventType / EventInfo 的事件正文。 */
export interface EventBodyMap {
  ERROR: { method: string; error?: string };
  LC_EVENT: { event: string; success: boolean; error?: string };
  STATS: { messagesProcessed: number; errorsOccurred: number };
  DEBUG_RULE_NODE: {
    type: string;
    entityId?: string;
    entityType?: EntityType;
    msgId?: string;
    msgType?: string;
    dataType?: string;
    relationType?: string;
    data?: string;
    metadata?: string;
    error?: string;
  };
  DEBUG_RULE_CHAIN: { message?: string; error?: string };
  DEBUG_CALCULATED_FIELD: {
    calculatedFieldId: string;
    entityId?: string;
    entityType?: EntityType;
    msgId?: string;
    msgType?: string;
    arguments?: string;
    result?: string;
    error?: string;
  };
}

export type EventType = keyof EventBodyMap;

export interface EventInfo<T extends EventType = EventType> {
  id: { id: string };
  createdTime: number;
  tenantId: EntityId<EntityType.TENANT>;
  entityId: EntityId;
  type: T;
  uid: string;
  body: EventBodyMap[T] & { server: string };
}

export interface EventTimeRange {
  startTime?: number;
  endTime?: number;
}

export interface EventQuery extends EventTimeRange, PageLink {
  tenantId: string;
  sortProperty?: 'id' | 'ts';
}

export interface DebugEventFilter {
  isError?: boolean;
  errorStr?: string;
}

/** eventType 决定后端使用哪一种 EventFilter。 */
export type EventFilter = (
  | (DebugEventFilter & {
      eventType: 'DEBUG_CALCULATED_FIELD';
      entityId?: string;
      entityType?: EntityType;
      msgId?: string;
      msgType?: string;
      arguments?: string;
      result?: string;
    })
  | (DebugEventFilter & {
      eventType: 'DEBUG_RULE_CHAIN';
      message?: string;
    })
  | (DebugEventFilter & {
      eventType: 'DEBUG_RULE_NODE';
      msgDirectionType?: 'IN' | 'OUT';
      entityId?: string;
      entityType?: EntityType;
      msgId?: string;
      msgType?: string;
      relationType?: string;
      dataSearch?: string;
      metadataSearch?: string;
    })
  | { eventType: 'ERROR'; method?: string; errorStr?: string }
  | {
      eventType: 'LC_EVENT';
      event?: string;
      status?: string;
      errorStr?: string;
    }
  | {
      eventType: 'STATS';
      minMessagesProcessed?: number;
      maxMessagesProcessed?: number;
      minErrorsOccurred?: number;
      maxErrorsOccurred?: number;
    }
) & { server?: string };

/** EventController.getEventsByType */
export function getEventsByType<T extends EventType>(
  entityId: EntityId,
  eventType: T,
  params: EventQuery,
) {
  return requestClient.get<PageData<EventInfo<T>>>(
    `/events/${entityId.entityType}/${entityId.id}/${eventType}`,
    { params },
  );
}

/** EventController.getEventsByFilter */
export function getEventsByFilter(
  entityId: EntityId,
  filter: EventFilter,
  params: EventQuery,
) {
  return requestClient.post<PageData<EventInfo>>(
    `/events/${entityId.entityType}/${entityId.id}`,
    filter,
    { params },
  );
}

/** EventController.clearEvents；租户由后端当前登录用户确定。 */
export function clearEvents(
  entityId: EntityId,
  filter: EventFilter,
  params: EventTimeRange = {},
): Promise<void> {
  return requestClient.post(
    `/events/${entityId.entityType}/${entityId.id}/clear`,
    filter,
    { params },
  );
}

/** @deprecated 后端保留的生命周期事件查询，请使用 getEventsByType。 */
export function getEventsDeprecated(entityId: EntityId, params: EventQuery) {
  return requestClient.get<PageData<EventInfo<'LC_EVENT'>>>(
    `/events/${entityId.entityType}/${entityId.id}`,
    { params },
  );
}
