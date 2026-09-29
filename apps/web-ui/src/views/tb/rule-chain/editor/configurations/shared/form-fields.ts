import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function requiredText(label: string) {
  const message = $t('ui.formRules.required', [$t(label)]);
  return z.string({ error: message }).trim().min(1, message);
}

export function mappingField(fieldName: string, label: string): VbenFormSchema {
  return {
    fieldName,
    label: $t(label),
    formItemClass: 'sm:col-span-2',
    type: 'array',
    children: ['key', 'value'].map((name) => ({
      fieldName: name,
      label: $t(`rule-chain.config.${name === 'key' ? 'mapKey' : 'mapValue'}`),
      component: 'VbenInput',
      modelPropName: 'modelValue',
      rules: requiredText(
        `rule-chain.config.${name === 'key' ? 'mapKey' : 'mapValue'}`,
      ),
    })),
    arrayProps: {
      showIndex: false,
      addButtonText: $t('rule-chain.config.addRow'),
      emptyText: $t('rule-chain.config.noRows'),
      actionText: $t('tb.common.actions'),
    },
  };
}
