<script lang="ts" setup>
import type { ArgumentFormData, ArgumentValues, SourceType } from './data';

import type { VbenFormSchema } from '#/adapter/form';
import type { TbUserInfo } from '#/api/core/user';

import { computed, markRaw, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { useVbenForm } from '#/adapter/form';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

import EntityKeyInput from '../entity-key-input.vue';
import {
  createDefaultArgumentFormValues,
  sourceEntityTypes,
  sourceOptions,
  validateArgumentValues,
} from './data';

type ArgumentDraft = Omit<ArgumentValues, 'timeWindow'> & {
  timeWindow: null | number;
};
const emit = defineEmits<{ success: [value: ArgumentValues] }>();
const record = ref<ArgumentFormData>();
const userStore = useUserStore();
const tenantId = computed(
  () => (userStore.userInfo as null | TbUserInfo)?.tbUser?.tenantId?.id ?? '',
);
const [Form, formApi] = useVbenForm<ArgumentDraft>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
});
const formSchema = computed<VbenFormSchema<ArgumentDraft>[]>(() => [
  {
    component: 'Select',
    fieldName: 'sourceType',
    dependencies: {
      triggerFields: ['sourceType'],
      resolve: ({ values: formValues }) => ({
        if:
          !record.value?.hideSource ||
          (!!formValues.sourceType && formValues.sourceType !== 'CURRENT'),
        componentProps: {
          disabled:
            record.value?.onlyCurrentEntity &&
            formValues.sourceType === 'CURRENT',
        },
      }),
    },
    label: $t('tb.components.fieldArguments.fields.source'),
    rules: 'selectRequired',
    componentProps: {
      options: sourceOptions().filter(
        ({ value }) => !record.value?.onlyCurrentEntity || value === 'CURRENT',
      ),
      onChange: handleSourceTypeChange,
    },
  },
  {
    component: 'EntityInput',
    fieldName: 'sourceId',
    label: $t('tb.components.fieldArguments.fields.sourceEntity'),
    rules: 'selectRequired',
    dependencies: {
      triggerFields: ['sourceType'],
      if: (formValues) =>
        formValues?.sourceType !== EntityType.TENANT &&
        sourceEntityTypes.some((type) => type === formValues?.sourceType),
    },
    componentProps: () => ({
      entityType: sourceEntityTypes.find(
        (type) => type === formApi.form.values.sourceType,
      ),
      key: formApi.form.values.sourceType,
      showSearch: true,
      onChange: (_value: unknown, option?: { label?: string }) => {
        void formApi.setFieldValue('sourceName', option?.label ?? '');
      },
    }),
  },
  {
    component: 'Select',
    fieldName: 'keyType',
    dependencies: {
      triggerFields: [],
      if: () => !record.value?.hideKeyType,
    },
    label: $t('tb.components.fieldArguments.fields.keyType'),
    rules: 'selectRequired',
    componentProps: {
      options: [
        {
          value: 'TS_LATEST',
          label: $t('tb.components.fieldArguments.options.TS_LATEST'),
        },
        {
          value: 'ATTRIBUTE',
          label: $t('tb.components.fieldArguments.options.ATTRIBUTE'),
        },
        {
          value: 'TS_ROLLING',
          label: $t('tb.components.fieldArguments.options.TS_ROLLING'),
        },
      ].filter(({ value }) => {
        if (value === 'TS_LATEST') return true;
        if (record.value?.latestTelemetryOnly) return false;
        return value === 'ATTRIBUTE' || record.value?.allowRolling;
      }),
      disabled: record.value?.latestTelemetryOnly,
      onChange: resetKey,
    },
  },
  {
    component: 'Select',
    fieldName: 'scope',
    label: $t('tb.components.fieldArguments.fields.scope'),
    rules: 'selectRequired',
    componentProps: { onChange: resetKey },
    dependencies: {
      triggerFields: ['keyType', 'sourceType'],
      resolve: ({ values: formValues }) => ({
        if: formValues.keyType === 'ATTRIBUTE',
        componentProps: {
          options: [
            {
              value: 'SERVER_SCOPE',
              label: $t('tb.components.fieldArguments.options.SERVER_SCOPE'),
            },
            {
              value: 'SHARED_SCOPE',
              label: $t('tb.components.fieldArguments.options.SHARED_SCOPE'),
            },
            {
              value: 'CLIENT_SCOPE',
              label: $t('tb.components.fieldArguments.options.CLIENT_SCOPE'),
            },
          ].filter(
            ({ value }) =>
              value === 'SERVER_SCOPE' || canSelectAttributeScope(formValues),
          ),
          disabled: !canSelectAttributeScope(formValues),
        },
      }),
    },
  },
  {
    component: markRaw(EntityKeyInput),
    modelPropName: 'value',
    fieldName: 'key',
    label: $t('tb.components.fieldArguments.fields.key'),
    rules: 'required',
    componentProps: {
      entityType: record.value?.entityId.entityType,
      entityId: record.value?.entityId.id,
      entityName: record.value?.entityName,
      ownerId: record.value?.ownerId,
      predefinedEntityFilter: record.value?.predefinedEntityFilter,
      onChange: (key: string) => {
        if (record.value?.watchKeyChange) formApi.setFieldValue('name', key);
      },
    },
    dependencies: {
      triggerFields: ['sourceType', 'sourceId', 'keyType', 'scope'],
      resolve: ({ values: formValues }) => ({
        componentProps: {
          sourceType: formValues.sourceType,
          sourceId: formValues.sourceId,
          keyType: formValues.keyType,
          scope: formValues.scope,
        },
      }),
    },
  },
  {
    component: 'VbenInput',
    fieldName: 'name',
    label: $t('tb.components.fieldArguments.fields.argumentName'),
    componentProps: {
      maxlength: 255,
    },
    rules: 'required',
  },
  {
    component: 'VbenInput',
    fieldName: 'defaultValue',
    label: $t('tb.components.fieldArguments.fields.defaultValue'),
    dependencies: {
      triggerFields: ['keyType'],
      if: (formValues) =>
        !record.value?.hideDefaultValue && formValues?.keyType !== 'TS_ROLLING',
      rules: () => (record.value?.defaultValueRequired ? 'required' : null),
    },
  },
  {
    component: 'SecondsInput',
    fieldName: 'timeWindow',
    label: $t('tb.components.fieldArguments.fields.timeWindow'),
    rules: 'required',
    dependencies: {
      triggerFields: ['keyType'],
      if: (formValues) => formValues?.keyType === 'TS_ROLLING',
    },
    componentProps: {
      min: 1,
      max: Math.floor(Number.MAX_SAFE_INTEGER / 1000),
      'aria-label': $t('tb.components.fieldArguments.fields.timeWindow'),
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'limit',
    label: $t('tb.components.fieldArguments.fields.limit'),
    rules: 'required',
    dependencies: {
      triggerFields: ['keyType'],
      if: (formValues) =>
        formValues?.keyType === 'TS_ROLLING' && !!record.value?.maxDataPoints,
    },
    componentProps: {
      min: 1,
      max: record.value?.maxDataPoints || undefined,
      precision: 0,
    },
  },
]);

function canSelectAttributeScope(
  formValues: Pick<ArgumentValues, 'sourceType'>,
) {
  const entityType =
    formValues.sourceType === 'CURRENT'
      ? record.value?.entityId.entityType
      : formValues.sourceType;
  return (
    entityType === EntityType.DEVICE || entityType === EntityType.DEVICE_PROFILE
  );
}
function resetKey() {
  return formApi.setValues({
    key: '',
    ...(record.value?.watchKeyChange ? { name: '' } : {}),
  });
}
async function handleSourceTypeChange(sourceType: SourceType) {
  await formApi.setValues(
    {
      sourceId: sourceType === EntityType.TENANT ? tenantId.value : '',
      sourceName: '',
      scope: 'SERVER_SCOPE',
    },
    false,
  );
  await resetKey();
}
const [Modal, modalApi] = useVbenModal<ArgumentFormData>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    const draft = await formApi.getValues();
    const formValues = { ...draft, timeWindow: (draft.timeWindow ?? 0) * 1000 };
    const issues = validateArgumentValues(
      formValues,
      record.value ?? {},
      record.value?.usedNames,
    );
    for (const issue of issues)
      await formApi.setFieldError(issue.fieldName, issue.message);
    if (!valid || issues.length > 0) {
      formApi.scrollToFirstError(issues[0]?.fieldName ?? 'name');
      return;
    }
    emit('success', {
      ...formValues,
      name: formValues.name.trim(),
      key: formValues.key.trim(),
      scope: canSelectAttributeScope(formValues)
        ? formValues.scope
        : 'SERVER_SCOPE',
      sourceName: formValues.sourceName,
    });
    modalApi.close();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    record.value = modalApi.getData();
    // 仅拷贝弹窗草稿，取消时不会修改调用方传入的参数。
    const value = record.value?.value;
    const formValues = value
      ? {
          ...value,
          levels: value.levels.map((level) => ({ ...level })),
        }
      : createDefaultArgumentFormValues(record.value);
    if (formValues.sourceType === EntityType.TENANT)
      formValues.sourceId = tenantId.value;
    await formApi.reset({
      values: { ...formValues, timeWindow: formValues.timeWindow / 1000 },
    });
    modalApi.setState({
      title: $t('tb.components.fieldArguments.menu'),
      confirmText: record.value?.value
        ? $t('tb.common.save')
        : $t('tb.components.fieldArguments.actions.addArgument'),
    });
  },
});
</script>

<template>
  <Modal class="rounded-xl" content-class="px-6 pt-5 pb-1">
    <Form class="form-message-flow" :schema="formSchema" />
  </Modal>
</template>
