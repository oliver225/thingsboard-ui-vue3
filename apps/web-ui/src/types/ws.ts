/** ThingsBoard /api/ws 协议；连接与编号由 store/websocket.ts 管理。 */
import type {
  AlarmCountQuery,
  AlarmData,
  AlarmDataQuery,
  EntityCountQuery,
  EntityData,
  EntityDataQuery,
  EntityKey,
} from '#/api/tb/entity-query';
import type { Notification } from '#/api/tb/notification';
import type {
  Aggregation,
  IntervalType,
  TelemetryValue,
} from '#/api/tb/telemetry';
import type {
  AlarmSeverity,
  AttributeScope,
  EntityType,
  NotificationType,
} from '#/enums';
import type { EntityId, PageData } from '#/types/tb';

interface TimeOptions {
  interval?: number;
  intervalType?: 'CUSTOM' | IntervalType;
  timeZoneId?: string;
  limit?: number;
  agg?: Aggregation;
  fetchLatestPreviousPoint?: boolean;
}
export interface WsHistoryQuery extends TimeOptions {
  keys: string[];
  startTs: number;
  endTs: number;
}
interface TimeQuery extends TimeOptions {
  keys: string[];
  startTs: number;
  timeWindow: number;
}
interface AggKey {
  id: number;
  key: string;
  agg: Aggregation;
  previousStartTs?: number;
  previousEndTs?: number;
  previousValueOnly?: boolean;
}
export type WsCommand =
  | {
      type: 'ALARM_COUNT';
      // 首页统计当前用户可见的全部告警，不限定设备等单一实体类型。
      query?: Omit<AlarmCountQuery, 'entityFilter'> &
        Partial<Pick<AlarmCountQuery, 'entityFilter'>>;
    }
  | { type: 'ALARM_DATA'; query?: AlarmDataQuery }
  | {
      type: 'ALARM_STATUS';
      originatorId: EntityId;
      severityList?: AlarmSeverity[];
      typeList?: string[];
    }
  | {
      type: 'ATTRIBUTES';
      entityType: EntityType;
      entityId: string;
      scope?: AttributeScope;
      keys?: string;
    }
  | { type: 'ENTITY_COUNT'; query?: EntityCountQuery }
  | {
      type: 'ENTITY_DATA';
      query?: EntityDataQuery;
      historyCmd?: WsHistoryQuery;
      latestCmd?: { keys: EntityKey[] };
      tsCmd?: TimeQuery;
      aggHistoryCmd?: { keys: AggKey[]; startTs: number; endTs: number };
      aggTsCmd?: { keys: AggKey[]; startTs: number; timeWindow: number };
    }
  | { type: 'MARK_ALL_NOTIFICATIONS_AS_READ' }
  | { type: 'MARK_NOTIFICATIONS_AS_READ'; notifications: string[] }
  | { type: 'NOTIFICATIONS'; limit?: number; types?: NotificationType[] }
  | { type: 'NOTIFICATIONS_COUNT' }
  | {
      type: 'TIMESERIES';
      entityType: EntityType;
      entityId: string;
      scope?: 'LATEST_TELEMETRY' | AttributeScope;
      keys?: string;
      startTs?: number;
      timeWindow?: number;
      interval?: number;
      limit?: number;
      agg?: Aggregation;
    }
  | {
      type: 'TIMESERIES_HISTORY';
      entityType: EntityType;
      entityId: string;
      keys: string;
      startTs: number;
      endTs: number;
      interval?: number;
      limit?: number;
      agg?: Aggregation;
    };

export type SubscriptionData = Record<
  string,
  [number, TelemetryValue, number?][]
>;
interface Response {
  cmdId?: number;
  errorCode?: number;
  errorMsg?: string;
}
export interface TelemetryMessage extends Response {
  subscriptionId: number;
  cmdUpdateType?: never;
  data: SubscriptionData;
}
interface EntityDataMessage extends Response {
  cmdUpdateType: 'ENTITY_DATA';
  data?: PageData<EntityData>;
  update?: EntityData[];
}
interface AlarmDataMessage extends Response {
  cmdUpdateType: 'ALARM_DATA';
  data?: PageData<AlarmData>;
  update?: AlarmData[];
  allowedEntities: number;
  totalEntities: number;
}
export interface NotificationMessage extends Response {
  cmdUpdateType: 'NOTIFICATIONS' | 'NOTIFICATIONS_COUNT';
  notifications?: Notification[];
  update?: Notification;
  totalUnreadCount: number;
  sequenceNumber: number;
}
export type WsMessage =
  | AlarmDataMessage
  | EntityDataMessage
  | NotificationMessage
  | (Response & {
      cmdUpdateType: 'ALARM_COUNT_DATA' | 'COUNT_DATA';
      count: number;
    })
  | (Response & { cmdUpdateType: 'ALARM_STATUS'; active: boolean })
  | TelemetryMessage;

export type WsStatus = 'error' | 'idle' | 'live' | 'loading' | 'stale';
export interface WsHandlers {
  onData: (message: WsMessage) => void;
  onError?: (error: Error) => void;
  onStatus?: (status: WsStatus) => void;
  onReset?: () => void;
}
export interface WsRequestOptions<T> {
  signal?: AbortSignal;
  timeout?: number;
  /** undefined 继续等待；空数组、0、false、null 均为有效结果。 */
  select: (message: WsMessage) => T | undefined;
}
export interface WsNotifications {
  notifications: Notification[];
  totalUnreadCount: number;
  sequenceNumber: number;
}
