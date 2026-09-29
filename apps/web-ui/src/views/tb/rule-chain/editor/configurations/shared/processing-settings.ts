import type { FormValidationIssue } from '#/types/form';

import { $t } from '#/locales';

export interface ProcessingStrategy {
  type: 'DEDUPLICATE' | 'ON_EVERY_MESSAGE' | 'SKIP';
  deduplicationIntervalSecs?: number;
}
export interface ProcessingSettings {
  type: 'ADVANCED' | 'DEDUPLICATE' | 'ON_EVERY_MESSAGE' | 'WEBSOCKETS_ONLY';
  deduplicationIntervalSecs?: number;
  attributes?: ProcessingStrategy;
  timeseries?: ProcessingStrategy;
  latest?: ProcessingStrategy;
  webSockets?: ProcessingStrategy;
  calculatedFields?: ProcessingStrategy;
}
export type ProcessingTarget =
  | 'attributes'
  | 'calculatedFields'
  | 'latest'
  | 'timeseries'
  | 'webSockets';

export function processingTargets(timeseries: boolean): ProcessingTarget[] {
  return timeseries
    ? ['timeseries', 'latest', 'webSockets', 'calculatedFields']
    : ['attributes', 'webSockets', 'calculatedFields'];
}

export function initialProcessingSettings(
  settings: Partial<ProcessingSettings> = {},
  timeseries = false,
): ProcessingSettings {
  return {
    ...settings,
    type: settings.type ?? 'ON_EVERY_MESSAGE',
    deduplicationIntervalSecs: settings.deduplicationIntervalSecs ?? 60,
    ...Object.fromEntries(
      processingTargets(timeseries).map((key) => [
        key,
        {
          type: 'ON_EVERY_MESSAGE',
          deduplicationIntervalSecs: 60,
          ...settings[key],
        },
      ]),
    ),
  };
}

export function validateProcessingSettings(
  settings: ProcessingSettings,
  timeseries = false,
): FormValidationIssue[] {
  const strategies =
    settings?.type === 'ADVANCED'
      ? processingTargets(timeseries).map((key) => settings[key])
      : [settings];
  const valid = strategies.every(
    (strategy) =>
      strategy &&
      [
        'DEDUPLICATE',
        'ON_EVERY_MESSAGE',
        ...(settings.type === 'ADVANCED' ? ['SKIP'] : ['WEBSOCKETS_ONLY']),
      ].includes(strategy.type) &&
      (strategy.type !== 'DEDUPLICATE' ||
        (typeof strategy.deduplicationIntervalSecs === 'number' &&
          Number.isInteger(strategy.deduplicationIntervalSecs) &&
          strategy.deduplicationIntervalSecs >= 1 &&
          strategy.deduplicationIntervalSecs <= 86_400)),
  );
  return valid
    ? []
    : [
        {
          fieldName: 'configuration.processingSettings',
          message: $t('rule-chain.actionUi.processingInvalid'),
        },
      ];
}

export function toProcessingSettings(settings: ProcessingSettings) {
  const { type } = settings;
  if (type === 'DEDUPLICATE')
    return {
      type,
      deduplicationIntervalSecs: settings.deduplicationIntervalSecs,
    };
  if (type !== 'ADVANCED') return { type };
  const result: ProcessingSettings = { type };
  for (const key of [
    'attributes',
    'timeseries',
    'latest',
    'webSockets',
    'calculatedFields',
  ] as const) {
    const strategy = settings[key];
    if (strategy)
      result[key] =
        strategy.type === 'DEDUPLICATE'
          ? { ...strategy }
          : { type: strategy.type };
  }
  return result;
}
