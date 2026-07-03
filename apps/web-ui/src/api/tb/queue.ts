import type {
  EntityType,
  QueueProcessingStrategyType,
  QueueSubmitStrategyType,
} from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';
import { QueueServiceType } from '#/enums';

export interface QueueSubmitStrategy {
  batchSize?: number;
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
