import type { AttributeData, TelemetryValue } from '#/api/tb/telemetry';
import type { SubscriptionData } from '#/types/ws';

import { AttributeValueType, inferAttributeValueType } from '#/enums';

/** 首包为快照，后续只包含变动的键；时间戳 0 表示删除。 */
export function mergeTelemetry(
  previous: AttributeData[],
  data: SubscriptionData,
) {
  const rows = new Map(previous.map((row) => [row.key, row]));
  for (const [key, points] of Object.entries(data)) {
    const point = points[0];
    if (!point) continue;
    const [lastUpdateTs, value] = point;
    if (lastUpdateTs === 0) rows.delete(key);
    else if (lastUpdateTs >= (rows.get(key)?.lastUpdateTs ?? 0)) {
      rows.set(key, { key, value, lastUpdateTs });
    }
  }
  return [...rows.values()];
}

export function getAttributeValueType(value: TelemetryValue) {
  return value === null
    ? AttributeValueType.JSON
    : inferAttributeValueType(value);
}

export function formatTelemetryValue(
  value: TelemetryValue,
  pretty = false,
): string {
  return typeof value === 'string'
    ? value
    : JSON.stringify(value, null, pretty ? 2 : undefined);
}
