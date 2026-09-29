import type { AlarmRuleDefinition } from '#/api/tb/alarm-rule';
import type { CalculatedField } from '#/api/tb/calculated-field';
import type { EntityDebugSettings } from '#/types/tb';

import { message } from 'antdv-next';

import { getAlarmRuleById, saveAlarmRule } from '#/api/tb/alarm-rule';
import {
  getCalculatedFieldById,
  saveCalculatedField,
} from '#/api/tb/calculated-field';
import { $t } from '#/locales';

export async function saveDebugSettings(
  record: AlarmRuleDefinition | CalculatedField | undefined,
  debugSettings: EntityDebugSettings,
  type: 'alarmRule' | 'calculatedField',
) {
  if (!record?.id?.id) return;
  try {
    // 读取最新配置，只替换调试设置，避免覆盖其他编辑。
    if (type === 'alarmRule') {
      const current = await getAlarmRuleById(record.id.id);
      const saved = await saveAlarmRule({ ...current, debugSettings });
      record.debugSettings = saved.debugSettings;
    } else {
      const current = await getCalculatedFieldById(record.id.id);
      const saved = await saveCalculatedField({ ...current, debugSettings });
      record.debugSettings = saved.debugSettings;
    }
    message.success($t('tb.components.debugSettings.messages.saved'));
  } catch {
    message.error($t('tb.components.debugSettings.messages.saveFailed'));
  }
}
