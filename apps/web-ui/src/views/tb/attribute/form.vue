<script lang="ts" setup>
/**
 * 属性 新增 / 编辑
 */
import type { VbenFormSchema } from '#/adapter/form';
import type { AttributeData } from '#/api/tb/telemetry';
import type { AttributeScope, EntityType } from '#/enums';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { saveEntityAttributes } from '#/api/tb/telemetry';
import {
  AttributeValueType,
  attributeValueTypeOptions,
  inferAttributeValueType,
} from '#/enums';
import { $t } from '#/locales';

interface AttributeFormValues {
  key: string;
  valueBoolean?: boolean;
  valueDouble?: number;
  valueInteger?: number;
  valueJson?: string;
  valueString?: string;
  valueType: AttributeValueType;
}

const emit = defineEmits<{ success: [] }>();

const entityType = ref<EntityType | string>('');
const entityId = ref('');
const scope = ref<AttributeScope>();
const record = ref<AttributeData | null>(null);

const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: () => ({
      size: 'large',
      allowClear: true,
      disabled: !!record.value?.key,
    }),
    fieldName: 'key',
    label: $t('tb.attribute.fields.key'),
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      size: 'large',
      class: 'w-full',
      allowClear: false,
      options: attributeValueTypeOptions(),
    },
    defaultValue: AttributeValueType.STRING,
    fieldName: 'valueType',
    label: $t('tb.attribute.fields.valueType'),
  },
  {
    component: 'Input',
    dependencies: {
      if: (values) => values.valueType === AttributeValueType.STRING,
      triggerFields: ['valueType'],
    },
    componentProps: () => ({ size: 'large' }),
    fieldName: 'valueString',
    label: $t('tb.attribute.fields.value'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { size: 'large', precision: 0, style: { width: '100%' } },
    dependencies: {
      if: (values) => values.valueType === AttributeValueType.INTEGER,
      triggerFields: ['valueType'],
    },
    fieldName: 'valueInteger',
    label: $t('tb.attribute.fields.value'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { size: 'large', style: { width: '100%' } },
    dependencies: {
      if: (values) => values.valueType === AttributeValueType.DOUBLE,
      triggerFields: ['valueType'],
    },
    fieldName: 'valueDouble',
    label: $t('tb.attribute.fields.value'),
    rules: 'required',
  },
  {
    component: 'Switch',
    componentProps: {
      checkedChildren: $t('tb.common.yes'),
      unCheckedChildren: $t('tb.common.no'),
    },
    defaultValue: false,
    dependencies: {
      if: (values) => values.valueType === AttributeValueType.BOOLEAN,
      triggerFields: ['valueType'],
    },
    fieldName: 'valueBoolean',
    label: $t('tb.attribute.fields.value'),
  },
  {
    component: 'Textarea',
    componentProps: { rows: 6 },
    dependencies: {
      if: (values) => values.valueType === AttributeValueType.JSON,
      triggerFields: ['valueType'],
    },
    fieldName: 'valueJson',
    label: $t('tb.attribute.fields.value'),
    rules: 'required',
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: { colon: true, labelWidth: 90 },
  schema,
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    if (!scope.value) return;

    const values = await formApi.getValues<AttributeFormValues>();

    let value: any;
    switch (values.valueType) {
      case AttributeValueType.BOOLEAN: {
        value = values.valueBoolean === true;
        break;
      }
      case AttributeValueType.DOUBLE: {
        value = Number(values.valueDouble);
        break;
      }
      case AttributeValueType.INTEGER: {
        value = Number(values.valueInteger);
        break;
      }
      case AttributeValueType.JSON: {
        try {
          value = JSON.parse(values.valueJson ?? '');
        } catch {
          message.error($t('tb.attribute.validation.invalidJson'));
          return;
        }
        break;
      }
      default: {
        value = values.valueString ?? '';
      }
    }

    modalApi.lock();
    try {
      // 表单只在 服务端 / 共享 作用域下打开(客户端属性只读)
      await saveEntityAttributes(
        entityType.value,
        entityId.value,
        scope.value as
          | AttributeScope.SERVER_SCOPE
          | AttributeScope.SHARED_SCOPE,
        { [values.key.trim()]: value },
      );
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data =
      modalApi.getData<{
        attribute?: AttributeData;
        entityId?: string;
        entityType?: EntityType | string;
        scope?: AttributeScope;
      }>() ?? {};

    record.value = data.attribute ?? null;
    entityType.value = data.entityType ?? '';
    entityId.value = data.entityId ?? '';
    scope.value = data.scope;

    await formApi.resetForm();

    if (record.value) {
      const valueType = inferAttributeValueType(record.value.value);
      const patch: Partial<AttributeFormValues> = {
        key: record.value.key,
        valueType,
      };
      switch (valueType) {
        case AttributeValueType.BOOLEAN: {
          patch.valueBoolean = record.value.value === true;
          break;
        }
        case AttributeValueType.DOUBLE: {
          patch.valueDouble = record.value.value;
          break;
        }
        case AttributeValueType.INTEGER: {
          patch.valueInteger = record.value.value;
          break;
        }
        case AttributeValueType.JSON: {
          patch.valueJson = JSON.stringify(record.value.value, null, 2);
          break;
        }
        default: {
          patch.valueString = String(record.value.value ?? '');
        }
      }
      await formApi.setValues(patch);
    }

    modalApi.setState({
      title: record.value?.key
        ? $t('tb.attribute.actions.edit')
        : $t('tb.attribute.actions.add'),
    });
  },
});
</script>

<template>
  <Modal
    class="w-1/3"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Form />
  </Modal>
</template>
