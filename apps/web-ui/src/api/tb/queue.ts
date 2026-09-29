import type {
  EntityType,
  QueueProcessingStrategyType,
  QueueSubmitStrategyType,
} from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';
import { QueueServiceType } from '#/enums';

export interface QueueSubmitStrategy {
  batchSize?: null | number;
  type?: QueueSubmitStrategyType;
}

export interface QueueProcessingStrategy {
  failurePercentage?: number;
  maxPauseBetweenRetries?: number;
  pauseBetweenRetries?: number;
  retries?: number;
  type?: QueueProcessingStrategyType;
}

export interface Queue extends BaseData<EntityType.QUEUE> {
  additionalInfo?: {
    [key: string]: any;
    description?: string;
    customProperties?: string;
    duplicateMsgToAllPartitions?: boolean;
  };
  consumerPerPartition?: boolean;
  name?: string;
  packProcessingTimeout?: number;
  partitions?: number;
  pollInterval?: number;
  processingStrategy?: QueueProcessingStrategy;
  submitStrategy?: QueueSubmitStrategy;
  tenantId?: EntityId<EntityType.TENANT>;
  topic?: string;
}

export interface QueueQuery extends PageLink {
  serviceType?: QueueServiceType;
}

export function getQueues(params: QueueQuery) {
  const { serviceType = QueueServiceType.TB_RULE_ENGINE, ...pageParams } =
    params;
  return requestClient.get<PageData<Queue>>('/queues', {
    params: {
      serviceType,
      ...pageParams,
    },
  });
}

export function deleteQueue(queueId: string): Promise<void> {
  return requestClient.delete(`/queues/${queueId}`);
}

export function getQueueById(queueId: string) {
  return requestClient.get<Queue>(`/queues/${queueId}`);
}

export function saveQueue(queue: Queue) {
  return requestClient.post<Queue>('/queues', queue, {
    params: { serviceType: QueueServiceType.TB_RULE_ENGINE },
  });
}

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteQueues(queueIds: string[]) {
  const ids = [...new Set(queueIds)];
  const results = await Promise.allSettled(ids.map((id) => deleteQueue(id)));
  const deletedIds: string[] = [];
  const failedIds: string[] = [];
  results.forEach((result, index) => {
    const id = ids[index];
    if (!id) return;
    (result.status === 'fulfilled' ? deletedIds : failedIds).push(id);
  });
  return { deletedIds, failedIds };
}
