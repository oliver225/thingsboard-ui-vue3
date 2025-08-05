import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { ProcessingStrategyType, SubmitStrategyType } from '/@/enums/queueEnum';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface Queue extends BasicModel<EntityType.QUEUE> {
  tenantId: EntityId<EntityType.TENANT>;
  name?: string;
  topic?: string;
  pollInterval?: number;
  partitions?: number;
  consumerPerPartition?: boolean;
  packProcessingTimeout?: number;
  submitStrategy: {
    type?: SubmitStrategyType;
    batchSize?: number;
  };
  processingStrategy: {
    type?: ProcessingStrategyType;
    retries?: number;
    failurePercentage?: number;
    pauseBetweenRetries?: number;
    maxPauseBetweenRetries?: number;
  };
  additionalInfo: { description?: string };
}

export function saveQueue(
  serviceType: 'TB_CORE' | 'TB_RULE_ENGINE' | 'TB_TRANSPORT' | 'JS_EXECUTOR' | 'TB_VC_EXECUTOR',
  data?: Queue | any,
) {
  return defHttp.postJson<Queue>({
    url: `/api/queues`,
    params: { serviceType: serviceType },
    data,
  });
}

export function queueList(
  params: BasicQuery,
  serviceType: 'TB_CORE' | 'TB_RULE_ENGINE' | 'TB_TRANSPORT' | 'JS_EXECUTOR' | 'TB_VC_EXECUTOR' = 'TB_RULE_ENGINE',
) {
  return defHttp.get<Page<Queue>>({
    url: `/api/queues`,
    params: { serviceType: serviceType, ...params },
  });
}

export function getQueueByName(queueName: string) {
  return defHttp.get<Queue>({
    url: `/api/queues/name/${queueName}`,
  });
}
export function getQueueById(queueId: string) {
  return defHttp.get<Queue>({
    url: `/api/queues/${queueId}`,
  });
}

export function deleteQueue(queueId: string) {
  return defHttp.delete<void>({
    url: `/api/queues/${queueId}`,
  });
}
