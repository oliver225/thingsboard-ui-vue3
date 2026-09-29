import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { NotificationRuleTriggerType } from '#/enums';

export interface TriggerFormApi {
  validate: () => Promise<{ valid: boolean }>;
  getValues: () => Promise<NotificationRuleTriggerConfig>;
}

export interface EscalationFormValues {
  delayInSec: number;
  targets: string[];
}

export function isAllowedTriggerType(
  triggerType: NotificationRuleTriggerType,
  isSysAdmin: boolean,
) {
  const systemTypes: NotificationRuleTriggerType[] = [
    NotificationRuleTriggerType.ENTITIES_LIMIT,
    NotificationRuleTriggerType.API_USAGE_LIMIT,
    NotificationRuleTriggerType.NEW_PLATFORM_VERSION,
    NotificationRuleTriggerType.RATE_LIMITS,
    NotificationRuleTriggerType.TASK_PROCESSING_FAILURE,
    NotificationRuleTriggerType.RESOURCES_SHORTAGE,
  ];
  return systemTypes.includes(triggerType) === isSysAdmin;
}

export function toEscalationFormValues(
  escalationTable?: Record<string, string[]>,
): EscalationFormValues[] {
  const escalations = Object.entries(escalationTable ?? {})
    .map(([delay, targets]) => ({
      delayInSec: Number(delay),
      targets: [...targets],
    }))
    .toSorted((first, second) => first.delayInSec - second.delayInSec);
  return escalations.length > 0
    ? escalations
    : [{ delayInSec: 0, targets: [] }];
}

export function toEscalationPayload(escalations: EscalationFormValues[]) {
  return Object.fromEntries(
    escalations.map(({ delayInSec, targets }) => [
      String(delayInSec),
      [...new Set(targets)],
    ]),
  );
}
