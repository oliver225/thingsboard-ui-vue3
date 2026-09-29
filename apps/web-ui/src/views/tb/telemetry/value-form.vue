<script setup lang="ts">
import type { AttributeData, TelemetryValue } from '#/api/tb/telemetry';
import type { EntityId } from '#/types/tb';

import { nextTick, shallowRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  getAttributeKeysByScope,
  saveEntityAttributesV2,
  saveEntityTelemetry,
} from '#/api/tb/telemetry';
import {
  AttributeScope,
  AttributeValueType,
  attributeValueTypeOptions,
} from '#/enums';
import { $t } from '#/locales';

import { getAttributeValueType } from './utils';

const props = defineProps<{
  entityId: EntityId;
  scope: 'LATEST_TELEMETRY' | AttributeScope;
}>();
const emit = defineEmits<{ success: [] }>();
const record = shallowRef<AttributeData>();

interface FormValues {
  key: string;
  valueType: AttributeValueType;
  stringValue: string;
  integerValue: number;
  doubleValue: number;
  booleanValue: boolean;
  jsonValue: string;
}

const [Form, formApi] = useVbenForm<FormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: () => ({ disabled: !!record.value, maxlength: 255 }),
      fieldName: 'key',
      label: $t('attribute.fields.key'),
      defaultValue: '',
      rules: z
        .string()
        .min(1, $t('attribute.validation.keyRequired'))
        .max(255, $t('attribute.validation.keyMaxLength'))
        .refine(
          (value) => !!value.trim(),
          $t('attribute.validation.keyRequired'),
        ),
    },
    {
      component: 'VbenSelect',
      componentProps: { options: attributeValueTypeOptions() },
      fieldName: 'valueType',
      label: $t('attribute.fields.valueType'),
      defaultValue: AttributeValueType.STRING,
      rules: 'required',
    },
    {
      component: 'VbenInput',
      fieldName: 'stringValue',
      label: $t('attribute.fields.value'),
      defaultValue: '',
      dependencies: {
        triggerFields: ['valueType'],
        resolve: ({ values }) => ({
          if: values.valueType === AttributeValueType.STRING,
        }),
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'integerValue',
      label: $t('attribute.fields.value'),
      defaultValue: 0,
      dependencies: {
        triggerFields: ['valueType'],
        resolve: ({ values }) => ({
          if: values.valueType === AttributeValueType.INTEGER,
        }),
      },
      rules: z
        .number()
        .refine(
          Number.isSafeInteger,
          $t('attribute.validation.invalidInteger'),
        ),
    },
    {
      component: 'InputNumber',
      fieldName: 'doubleValue',
      label: $t('attribute.fields.value'),
      defaultValue: 0,
      dependencies: {
        triggerFields: ['valueType'],
        resolve: ({ values }) => ({
          if: values.valueType === AttributeValueType.DOUBLE,
        }),
      },
      rules: z.number().finite($t('attribute.validation.invalidNumber')),
    },
    {
      component: 'TbCheckbox',
      componentProps: { class: 'w-auto' },
      fieldName: 'booleanValue',
      label: $t('attribute.fields.value'),
      defaultValue: false,
      dependencies: {
        triggerFields: ['valueType', 'booleanValue'],
        resolve: ({ values }) => ({
          if: values.valueType === AttributeValueType.BOOLEAN,
          componentProps: { title: String(values.booleanValue ?? false) },
        }),
      },
    },
    {
      component: 'JsonEditor',
      componentProps: {
        height: 160,
        required: true,
        showValidationMessage: false,
        ariaLabel: $t('attribute.fields.value'),
      },
      fieldName: 'jsonValue',
      label: $t('attribute.fields.value'),
      defaultValue: '{}',
      dependencies: {
        triggerFields: ['valueType'],
        resolve: ({ values }) => ({
          if: values.valueType === AttributeValueType.JSON,
        }),
      },
      rules: 'jsonRequired',
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ record?: AttributeData }>({
  async onOpenChange(open) {
    if (!open) return;
    if (props.scope === AttributeScope.CLIENT_SCOPE || !props.entityId.id) {
      modalApi.close();
      return;
    }
    record.value = modalApi.getData()?.record;
    let title = record.value
      ? $t('attribute.actions.edit')
      : $t('attribute.actions.add');
    if (props.scope === 'LATEST_TELEMETRY') {
      title = $t('telemetry.actions.add');
    }
    modalApi.setState({
      title,
    });
    const value = record.value?.value;
    await formApi.reset({
      values: {
        key: record.value?.key ?? '',
        valueType:
          value === undefined
            ? AttributeValueType.STRING
            : getAttributeValueType(value),
        stringValue: typeof value === 'string' ? value : '',
        integerValue:
          typeof value === 'number' && Number.isInteger(value) ? value : 0,
        doubleValue: typeof value === 'number' ? value : 0,
        booleanValue: typeof value === 'boolean' ? value : false,
        jsonValue: value === undefined ? '{}' : JSON.stringify(value, null, 2),
      },
    });
    await nextTick();
    await formApi.clearValidation();
  },
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || props.scope === AttributeScope.CLIENT_SCOPE) {
      return;
    }
    const values = await formApi.getValues();
    const value: TelemetryValue =
      values.valueType === AttributeValueType.JSON
        ? JSON.parse(values.jsonValue)
        : {
            BOOLEAN: values.booleanValue,
            DOUBLE: values.doubleValue,
            INTEGER: values.integerValue,
            STRING: values.stringValue,
          }[values.valueType];
    modalApi.lock();
    try {
      if (props.scope !== 'LATEST_TELEMETRY' && !record.value) {
        const keys = await getAttributeKeysByScope(props.entityId, props.scope);
        if (keys.includes(values.key)) {
          formApi.setFieldError('key', $t('attribute.validation.keyExists'));
          return;
        }
      }
      await (props.scope === 'LATEST_TELEMETRY'
        ? saveEntityTelemetry(props.entityId, { [values.key]: value })
        : saveEntityAttributesV2(props.entityId, props.scope, {
            [values.key]: value,
          }));
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <Form />
  </Modal>
</template>
