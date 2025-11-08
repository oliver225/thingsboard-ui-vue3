// Select options configurations
export const basicStrategyOptions = [
  { value: 'ON_EVERY_MESSAGE', label: 'tb.ruleChain.nodeAction.onEveryMessage' },
  { value: 'DEDUPLICATE', label: 'tb.ruleChain.nodeAction.deduplicate' },
  { value: 'WEBSOCKETS_ONLY', label: 'tb.ruleChain.nodeAction.webSocketsOnly' },
];

export const advancedStrategyOptions = [
  { value: 'ON_EVERY_MESSAGE', label: 'tb.ruleChain.nodeAction.onEveryMessage' },
  { value: 'DEDUPLICATE', label: 'tb.ruleChain.nodeAction.deduplicate' },
  { value: 'SKIP', label: 'tb.ruleChain.nodeAction.skip' },
];

export const ttlUnitOptions = [
  { value: 'SECONDS', label: 'tb.ruleChain.nodeAction.seconds' },
  { value: 'MINUTES', label: 'tb.ruleChain.nodeAction.minutes' },
  { value: 'HOURS', label: 'tb.ruleChain.nodeAction.hours' },
  { value: 'DAYS', label: 'tb.ruleChain.nodeAction.days' },
];
