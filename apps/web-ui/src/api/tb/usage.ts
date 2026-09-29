import type { Timeseries } from '#/api/tb/telemetry';
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';
import type { WsHistoryQuery } from '#/types/ws';

import { requestClient } from '#/api/request';
import { findEntityDataByQuery } from '#/api/tb/entity-query';
import { useWebsocketStore } from '#/store/websocket';

/** 首页用量汇总，沿用 master 分支 /api/usage 的字段契约。 */
export interface Usage {
  devices?: number;
  assets?: number;
  users?: number;
  dashboards?: number;
  customers?: number;
  transportMessages?: number;
  jsExecutions?: number;
  emails?: number;
  sms?: number;
  alarms?: number;
  maxDevices?: number;
  maxAssets?: number;
  maxUsers?: number;
  maxDashboards?: number;
  maxCustomers?: number;
  maxTransportMessages?: number;
  maxJsExecutions?: number;
  maxEmails?: number;
  maxSms?: number;
  maxAlarms?: number;
}

export function getUsage() {
  return requestClient.get<Usage>('/usage');
}

/** 与 api_usage.json 中 apiUsageState 实体别名及 latest data keys 相同。 */
export async function getApiUsageState(keys: string[]) {
  const result = await findEntityDataByQuery({
    entityFilter: { type: 'apiUsageState' },
    pageLink: { page: 0, pageSize: 1 },
    latestValues: keys.map((key) => ({ type: 'TIME_SERIES', key })),
  });
  return result.data[0];
}

export interface QueueStatistics extends BaseData<EntityType.QUEUE_STATS> {
  queueName: string;
  serviceId: string;
}

export function getQueueStatistics(params: PageLink) {
  return requestClient.get<PageData<QueueStatistics>>('/queueStats', {
    params,
  });
}

/** QUEUE_STATS 不支持普通遥测 HTTP 校验，使用实体历史命令。 */
export function getQueueUsageTelemetry(
  entityId: EntityId<EntityType.QUEUE_STATS>,
  historyCmd: WsHistoryQuery,
  signal?: AbortSignal,
): Promise<Timeseries> {
  return useWebsocketStore().request(
    {
      type: 'ENTITY_DATA',
      query: {
        entityFilter: { type: 'singleEntity', singleEntity: entityId },
        pageLink: { page: 0, pageSize: 1 },
      },
      historyCmd: { agg: 'NONE', interval: 0, ...historyCmd },
    },
    {
      signal,
      select(message) {
        if (message.cmdUpdateType !== 'ENTITY_DATA') return;
        const entity = message.data?.data[0] ?? message.update?.[0];
        if (entity?.timeseries) return entity.timeseries;
        if (message.data?.totalElements === 0) return {};
      },
    },
  );
}
