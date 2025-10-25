import { useI18n } from '/@/hooks/web/useI18n';

const { t } = useI18n();

// 队列 提交设置
export enum SubmitStrategyType {
  BURST = 'BURST',
  BATCH = 'BATCH',
  SEQUENTIAL = 'SEQUENTIAL',
  SEQUENTIAL_BY_TENANT = 'SEQUENTIAL_BY_TENANT',
  SEQUENTIAL_BY_ORIGINATOR = 'SEQUENTIAL_BY_ORIGINATOR',
}

// 队列 重试处理设置
export enum ProcessingStrategyType {
  RETRY_ALL = 'RETRY_ALL',
  RETRY_FAILED = 'RETRY_FAILED',
  RETRY_TIMED_OUT = 'RETRY_TIMED_OUT',
  SKIP_ALL_FAILURES = 'SKIP_ALL_FAILURES',
  RETRY_FAILED_AND_TIMED_OUT = 'RETRY_FAILED_AND_TIMED_OUT',
  SKIP_ALL_FAILURES_AND_TIMED_OUT = 'SKIP_ALL_FAILURES_AND_TIMED_OUT',
}

export const SUBMIT_STRATEGY_OPTIONS = [
  {
    value: SubmitStrategyType.SEQUENTIAL_BY_ORIGINATOR,
    label: t('tb.queue.enum.submitStrategy.sequentialByOriginator'),
    help: t('tb.queue.enum.submitStrategy.sequentialByOriginatorHelp'),
  },
  {
    value: SubmitStrategyType.SEQUENTIAL_BY_TENANT,
    label: t('tb.queue.enum.submitStrategy.sequentialByTenant'),
    help: t('tb.queue.enum.submitStrategy.sequentialByTenantHelp'),
  },
  {
    value: SubmitStrategyType.SEQUENTIAL,
    label: t('tb.queue.enum.submitStrategy.sequential'),
    help: t('tb.queue.enum.submitStrategy.sequentialHelp'),
  },
  {
    value: SubmitStrategyType.BURST,
    label: t('tb.queue.enum.submitStrategy.burst'),
    help: t('tb.queue.enum.submitStrategy.burstHelp'),
  },
  {
    value: SubmitStrategyType.BATCH,
    label: t('tb.queue.enum.submitStrategy.batch'),
    help: t('tb.queue.enum.submitStrategy.batchHelp'),
  },
];

export const PROCESSING_STRATEGY_OPTIONS = [
  {
    value: ProcessingStrategyType.RETRY_FAILED_AND_TIMED_OUT,
    label: t('tb.queue.enum.processingStrategy.retryFailedAndTimedOut'),
    help: t('tb.queue.enum.processingStrategy.retryFailedAndTimedOutHelp'),
  },
  {
    value: ProcessingStrategyType.SKIP_ALL_FAILURES,
    label: t('tb.queue.enum.processingStrategy.skipAllFailures'),
    help: t('tb.queue.enum.processingStrategy.skipAllFailuresHelp'),
  },
  {
    value: ProcessingStrategyType.SKIP_ALL_FAILURES_AND_TIMED_OUT,
    label: t('tb.queue.enum.processingStrategy.skipAllFailuresAndTimedOut'),
    help: t('tb.queue.enum.processingStrategy.skipAllFailuresAndTimedOutHelp'),
  },
  {
    value: ProcessingStrategyType.RETRY_ALL,
    label: t('tb.queue.enum.processingStrategy.retryAll'),
    help: t('tb.queue.enum.processingStrategy.retryAllHelp'),
  },
  {
    value: ProcessingStrategyType.RETRY_FAILED,
    label: t('tb.queue.enum.processingStrategy.retryFailed'),
    help: t('tb.queue.enum.processingStrategy.retryFailedHelp'),
  },
  {
    value: ProcessingStrategyType.RETRY_TIMED_OUT,
    label: t('tb.queue.enum.processingStrategy.retryTimedOut'),
    help: t('tb.queue.enum.processingStrategy.retryTimedOutHelp'),
  },
];
