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
    label: '按发起者顺序处理',
    help: '在确认设备A的前一条消息之前，不会提交设备A的新消息',
  },
  {
    value: SubmitStrategyType.SEQUENTIAL_BY_TENANT,
    label: '按租户顺序处理',
    help: '在确认租户A的前一条消息之前，不会提交租户A的新消息',
  },
  { value: SubmitStrategyType.SEQUENTIAL, label: '顺序处理', help: '在确认前一条消息之前，不会提交新消息' },
  { value: SubmitStrategyType.BURST, label: '突发处理', help: '所有消息都按到达顺序提交到规则链' },
  { value: SubmitStrategyType.BATCH, label: '批量处理', help: '在确认前一批消息之前，不会提交新批次' },
];

export const PROCESSING_STRATEGY_OPTIONS = [
  {
    value: ProcessingStrategyType.RETRY_FAILED_AND_TIMED_OUT,
    label: '失败与超时重试',
    help: '重试处理包中所有失败和超时的消息',
  },
  { value: ProcessingStrategyType.SKIP_ALL_FAILURES, label: '跳过所有失败', help: '忽略所有失败' },
  {
    value: ProcessingStrategyType.SKIP_ALL_FAILURES_AND_TIMED_OUT,
    label: '跳过所有失败和超时',
    help: '忽略所有失败和超时',
  },
  { value: ProcessingStrategyType.RETRY_ALL, label: '全部重试', help: '重试处理包中所有消息' },
  { value: ProcessingStrategyType.RETRY_FAILED, label: '失败重试', help: '重试处理包中所有失败消息' },
  { value: ProcessingStrategyType.RETRY_TIMED_OUT, label: '超时重试', help: '重试处理包中所有超时消息' },
];
