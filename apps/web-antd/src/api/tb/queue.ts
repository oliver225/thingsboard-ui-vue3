import type {
  EntityId,
  EntityType,
  ProcessingStrategyType,
  SubmitStrategyType,
} from '@vben/constants';

import type { BasicQuery, Page } from '#/api/model';

import { requestClient } from '#/api/request';

export namespace QueueApi {
  export interface Queue {
    id: EntityId<EntityType.QUEUE>;
    tenantId: EntityId<EntityType.TENANT>;
    name?: string;
    topic?: string;
    pollInterval?: number;
    partitions?: number;
    consumerPerPartition?: boolean;
    packProcessingTimeout?: number;
    submitStrategy: {
      batchSize?: number;
      type?: SubmitStrategyType;
    };
    processingStrategy: {
      failurePercentage?: number;
      maxPauseBetweenRetries?: number;
      pauseBetweenRetries?: number;
      retries?: number;
      type?: ProcessingStrategyType;
    };
    additionalInfo: { description?: string };
    createdTime?: number;
  }
}

export function saveQueueApi(
  serviceType:
    | 'JS_EXECUTOR'
    | 'TB_CORE'
    | 'TB_RULE_ENGINE'
    | 'TB_TRANSPORT'
    | 'TB_VC_EXECUTOR',
  data?: any | QueueApi.Queue,
) {
  return requestClient.post<QueueApi.Queue>(`/api/queues`, data, {
    params: { serviceType },
  });
}

export function queueListApi(
  params: BasicQuery,
  serviceType:
    | 'JS_EXECUTOR'
    | 'TB_CORE'
    | 'TB_RULE_ENGINE'
    | 'TB_TRANSPORT'
    | 'TB_VC_EXECUTOR' = 'TB_RULE_ENGINE',
) {
  return requestClient.get<Page<QueueApi.Queue>>(`/api/queues`, {
    serviceType,
    ...params,
  });
}

export function getQueueByNameApi(queueName: string) {
  return requestClient.get<QueueApi.Queue>(`/queues/name/${queueName}`);
}
export function getQueueByIdApi(queueId: string) {
  return requestClient.get<QueueApi.Queue>(`/queues/${queueId}`);
}

export function deleteQueueApi(queueId: string) {
  return requestClient.delete(`/queues/${queueId}`);
}
