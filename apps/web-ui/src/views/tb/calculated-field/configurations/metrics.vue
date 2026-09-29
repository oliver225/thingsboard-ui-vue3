<script lang="ts">
import type { MetricValues as MetricRow } from '../form-data';

import type { ArgumentValues as MetricArgument } from '#/adapter/component/field-arguments/data';

import { CalculatedFieldType as MetricFieldType } from '#/enums';
import { $t as translate } from '#/locales';
type RowIssue = {
  fieldName: string;
  message: string;
};

function validateRowName(name: string, usedNames: string[]): RowIssue[] {
  const value = name.trim();
  if (
    !/^[a-zA-Z_]\w*$/.test(value) ||
    value.length > 255 ||
    ['ctx', 'e', 'pi'].includes(value)
  ) {
    return [
      {
        fieldName: 'name',
        message: translate('calculated-fields.validation.name'),
      },
    ];
  }
  return usedNames.some((used) => used.toLowerCase() === value.toLowerCase())
    ? [
        {
          fieldName: 'name',
          message: translate('calculated-fields.validation.duplicate'),
        },
      ]
    : [];
}
export function validateMetricValues(
  row: MetricRow,
  type: MetricFieldType,
  args: Pick<MetricArgument, 'name'>[],
  usedNames: string[] = [],
): RowIssue[] {
  const issues = validateRowName(row.name, usedNames);
  const fail = (fieldName: string, key: string) =>
    issues.push({
      fieldName,
      message: translate(`calculated-fields.validation.${key}`),
    });
  if (
    row.inputType === 'key' &&
    !args.some((argument) => argument.name.trim() === row.inputKey)
  )
    fail('inputKey', 'metricKey');
  if (row.inputType === 'function' && !row.inputFunction.trim())
    fail('inputFunction', 'required');
  if (row.filterEnabled && !row.filter.trim()) fail('filter', 'required');
  if (
    type === MetricFieldType.ENTITY_AGGREGATION &&
    (row.inputType !== 'key' || row.function === 'COUNT_UNIQUE')
  )
    fail('function', 'metricType');
  if (row.defaultValue !== null && !Number.isFinite(row.defaultValue))
    fail('defaultValue', 'number');
  return issues;
}
</script>

<script setup lang="ts">
import type { MetricValues } from '../form-data';

import type { ArgumentValues } from '#/adapter/component/field-arguments/data';
import type { ScriptTestData } from '#/adapter/component/script-test/types';
import type { VbenFormSchema } from '#/adapter/form';
import type { ActionColumn, BasicColumn } from '#/adapter/table';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import { createScriptParameters } from '#/adapter/component/field-arguments/data';
import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { useVbenForm } from '#/adapter/form';
import FormField from '#/adapter/form-field.vue';
import { BasicTable, useTable } from '#/adapter/table';
import { CalculatedFieldType } from '#/enums';
import { $t } from '#/locales';

import { createDefaultMetricFormValues } from '../form-data';
const props = defineProps<{
  modelValue: MetricValues[];
  validationField?: string;
  arguments: ArgumentValues[];
  type: CalculatedFieldType;
  disabled?: boolean;
  maxItems?: number;
}>();
const emit = defineEmits<{
  'update:modelValue': [rows: MetricValues[]];
  test: [request?: ScriptTestData];
}>();
const rows = computed(() => props.modelValue);
const disabled = computed(() => !!props.disabled);
const canAdd = computed(
  () =>
    !disabled.value &&
    !(
      props.maxItems &&
      props.maxItems > 0 &&
      rows.value.length >= props.maxItems
    ),
);
const editingId = ref<string>();
const isReady = ref(false);
let editSession = 0;
const columns = computed<BasicColumn<MetricValues>[]>(() => [
  {
    dataIndex: 'name',
    title: $t('calculated-fields.fields.metricName'),
    width: 160,
    slot: 'name',
  },
  {
    dataIndex: 'function',
    title: $t('calculated-fields.fields.aggregationFunction'),
    width: 110,
    customRender: ({ record }) =>
      $t(`calculated-fields.options.${record.function}`),
  },
  {
    key: 'input',
    title:
      props.type === CalculatedFieldType.ENTITY_AGGREGATION
        ? $t('calculated-fields.fields.argumentName')
        : $t('calculated-fields.fields.metricInput'),
    width: 180,
    customRender: ({ record }) =>
      record.inputType === 'key'
        ? record.inputKey || '—'
        : $t('calculated-fields.fields.inputFunction'),
  },
  ...(props.type === CalculatedFieldType.ENTITY_AGGREGATION
    ? []
    : [
        {
          dataIndex: 'filterEnabled' as const,
          title: $t('calculated-fields.features.aggregation.filtered'),
          width: 110,
          slot: 'filterEnabled',
        },
      ]),
]);
const [Form, formApi] = useVbenForm<MetricValues & { _configuration?: string }>(
  {
    layout: 'vertical',
    commonConfig: {
      colon: false,
      componentProps: { class: 'w-full' },
      labelClass: 'text-sm font-medium',
      formItemClass: 'min-w-0 pb-4',
    },
    wrapperClass: 'grid-cols-1',
    showDefaultActions: false,
    schema: [
      {
        fieldName: '_configuration',
        component: 'VbenInput',
        hideLabel: true,
        formItemClass: 'pb-0',
      },
    ],
  },
);
async function handleChange(field: string, value: unknown) {
  await formApi.setFieldValue(field, value);
  await formApi.clearValidation();
}
function handleTest(expression: string, fieldName: string) {
  const session = editSession;
  emit('test', {
    expression,
    arguments: props.arguments,
    onApply: async (script) => {
      if (isReady.value && session === editSession)
        await handleChange(fieldName, script);
    },
  });
}
onBeforeUnmount(() => {
  ++editSession;
  emit('test');
});
const [ItemModal, itemModalApi] = useVbenModal<{ rowId?: string }>({
  async onOpenChange(open) {
    ++editSession;
    if (!open) {
      isReady.value = false;
      emit('test');
      return;
    }
    editingId.value = itemModalApi.getData()?.rowId;
    const row = rows.value.find((row) => row.rowId === editingId.value);
    itemModalApi.setState({
      title: $t('calculated-fields.sections.metricSettings'),
      confirmText: row
        ? $t('tb.common.save')
        : $t('calculated-fields.actions.addMetric'),
    });
    const draft = cloneDeep(row ?? createDefaultMetricFormValues());
    if (
      draft.inputType === 'key' &&
      !props.arguments.some(
        (argument) => argument.name.trim() === draft.inputKey,
      )
    )
      draft.inputKey = '';
    await formApi.reset({ values: draft });
    isReady.value = true;
    await nextTick();
    await formApi.clearValidation();
  },
  async onConfirm() {
    if (!isReady.value || disabled.value) return;
    await formApi.clearValidation();
    const { valid } = await formApi.validate();
    const row = await formApi.getValues();
    const issues = validateMetricValues(
      row,
      props.type,
      props.arguments,
      rows.value
        .filter((other) => other.rowId !== editingId.value)
        .map((other) => other.name.trim()),
    );
    for (const issue of issues)
      await formApi.setFieldError(issue.fieldName, issue.message);
    if (!valid || issues.length > 0) {
      formApi.scrollToFirstError(issues[0]?.fieldName ?? 'name');
      return;
    }
    onSuccess({ ...cloneDeep(row), name: row.name.trim() });
    itemModalApi.close();
  },
});
const actionColumn = computed<ActionColumn<MetricValues>>(() => ({
  width: 88,
  align: 'center',
  actionProps: (row) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        text: $t('tb.common.edit'),
        tooltip: $t('tb.common.edit'),
        icon: 'lucide:square-pen',
        size: 'icon',
        variant: 'ghost',
        disabled: disabled.value,
        onClick: () => handleEdit(row),
      },
      {
        key: 'delete',
        text: $t('calculated-fields.actions.remove'),
        tooltip: $t('calculated-fields.actions.remove'),
        icon: 'lucide:trash-2',
        size: 'icon',
        variant: 'ghost',
        danger: true,
        disabled: disabled.value,
        onClick: () => handleDelete(row),
      },
    ],
  }),
}));
const [registerTable] = useTable<MetricValues>({
  columns,
  actionColumn,
  dataSource: rows,
  rowKey: 'rowId',
  align: 'left',
  pagination: false,
  showIndexColumn: false,
  showTableSetting: false,
  canResize: false,
  isCanResizeParent: false,
  columnResizable: false,
  rowSelection: null,
  defaultRowSelection: null,
  striped: false,
  inset: true,
});
const errors = computed(() =>
  Object.fromEntries(
    rows.value.map((row, index) => [
      row.rowId,
      validateMetricValues(
        row,
        props.type,
        props.arguments,
        rows.value.slice(0, index).map((other) => other.name.trim()),
      )[0]?.message,
    ]),
  ),
);
function handleEdit(row?: MetricValues) {
  if (!disabled.value && (row || canAdd.value))
    itemModalApi.setData({ rowId: row?.rowId }).open();
}
function handleDelete(row: MetricValues) {
  if (!disabled.value)
    emit(
      'update:modelValue',
      rows.value.filter((other) => other.rowId !== row.rowId),
    );
}
function onSuccess(row: MetricValues) {
  if (disabled.value) return;
  emit(
    'update:modelValue',
    rows.value.some((other) => other.rowId === row.rowId)
      ? rows.value.map((other) => (other.rowId === row.rowId ? row : other))
      : [...rows.value, row],
  );
}
watch(disabled, (value) => {
  if (value) itemModalApi.close();
});
watch(
  () => props.validationField,
  (field) => {
    if (!field?.startsWith('metrics[')) return;
    const match = field.match(/\[(\d+)\]/);
    const row = match && rows.value[Number(match[1])];
    if (row) handleEdit(row);
  },
);
function getFields(row: MetricValues): VbenFormSchema[] {
  const entityAggregation =
    props.type === CalculatedFieldType.ENTITY_AGGREGATION;
  return [
    {
      fieldName: 'name',
      component: 'VbenInput',
      label: $t('calculated-fields.fields.metricName'),
      rules: 'required',
      componentProps: { maxlength: 255 },
    },
    {
      fieldName: 'function',
      component: 'VbenSelect',
      label: $t('calculated-fields.fields.aggregationFunction'),
      rules: 'selectRequired',
      componentProps: {
        options: (entityAggregation
          ? ['AVG', 'MIN', 'MAX', 'SUM', 'COUNT']
          : ['AVG', 'MIN', 'MAX', 'SUM', 'COUNT', 'COUNT_UNIQUE']
        ).map((value) => ({
          value,
          label: $t(`calculated-fields.options.${value}`),
        })),
      },
    },
    ...(entityAggregation
      ? []
      : [
          {
            fieldName: 'inputType',
            component: 'VbenSelect',
            label: $t('calculated-fields.fields.metricInput'),
            help: $t('calculated-fields.features.aggregation.inputHelp'),
            rules: 'selectRequired',
            componentProps: {
              options: ['key', 'function'].map((value) => ({
                value,
                label: $t(`calculated-fields.options.${value}`),
              })),
            },
          },
        ]),
    ...(row.inputType === 'key'
      ? [
          {
            fieldName: 'inputKey',
            component: 'VbenSelect',
            label: $t('calculated-fields.fields.argumentName'),
            rules: 'selectRequired',
            componentProps: {
              options: props.arguments
                .filter((argument) => argument.name.trim())
                .map((argument) => ({
                  value: argument.name.trim(),
                  label: argument.name.trim(),
                })),
            },
          },
        ]
      : [
          {
            fieldName: 'inputFunction',
            component: 'ScriptEditor',
            modelPropName: 'modelValue',
            label: $t('calculated-fields.fields.inputFunction'),
            rules: 'required',
            formItemClass: 'sm:col-span-2',
            componentProps: {
              language: 'tbel',
              testDisabled: props.arguments.length === 0,
              height: 240,
              ariaLabel: $t('calculated-fields.fields.inputFunction'),
              parameters: createScriptParameters(props.arguments),
              testHandler: (expression: string) =>
                handleTest(expression, 'inputFunction'),
            },
          },
        ]),
    ...(entityAggregation
      ? []
      : [
          {
            fieldName: 'filterEnabled',
            component: 'TbSwitch',
            hideLabel: true,
            formItemClass: 'sm:col-span-2 pb-2',
            componentProps: {
              title: $t('calculated-fields.fields.filterEnabled'),
              help: $t('calculated-fields.features.aggregation.filterHelp'),
              class: 'bg-muted/40',
            },
          },
        ]),
    ...(!entityAggregation && row.filterEnabled
      ? [
          {
            fieldName: 'filter',
            component: 'ScriptEditor',
            modelPropName: 'modelValue',
            label: $t('calculated-fields.fields.filter'),
            rules: 'required',
            formItemClass: 'sm:col-span-2',
            componentProps: {
              language: 'tbel',
              height: 240,
              ariaLabel: $t('calculated-fields.fields.filter'),
              parameters: createScriptParameters(props.arguments),
              testHandler: (expression: string) =>
                handleTest(expression, 'filter'),
            },
          },
        ]
      : []),
    ...(entityAggregation
      ? [
          {
            fieldName: 'defaultValue',
            component: 'InputNumber',
            label: $t('calculated-fields.fields.defaultValue'),
            componentProps: { class: 'w-full' },
          },
        ]
      : []),
  ];
}
</script>
<template>
  <div class="w-full min-w-0">
    <p v-if="!rows.length" class="text-destructive text-center text-sm">
      {{ $t('calculated-fields.validation.metrics') }}
    </p>
    <BasicTable v-else @register="registerTable">
      <template #name="{ record }">
        <span>{{ record.name }}</span>
        <p
          v-if="errors[record.rowId]"
          class="text-destructive mt-1 whitespace-normal text-xs"
        >
          {{ errors[record.rowId] }}
        </p>
      </template>
      <template #filterEnabled="{ record }">
        <TbCheckbox
          :checked="!!record.filterEnabled"
          disabled
          :aria-label="$t('calculated-fields.features.aggregation.filtered')"
        />
      </template>
    </BasicTable>
    <VbenButton
      type="button"
      variant="outline"
      size="sm"
      class="mt-3"
      :disabled="!canAdd"
      @click="handleEdit()"
    >
      <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />
      {{ $t('calculated-fields.actions.addMetric') }}
    </VbenButton>
    <p v-if="!canAdd && !disabled" class="text-muted-foreground mt-2 text-xs">
      {{ $t('calculated-fields.features.aggregation.maxMetrics') }}
    </p>
  </div>
  <ItemModal
    class="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <Form class="form-message-flow">
      <template #_configuration="{ values: formValues }">
        <div v-if="isReady" class="w-full min-w-0">
          <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField
              v-for="field in getFields(formValues)"
              :key="field.fieldName"
              :schema="field"
            />
          </div>
        </div>
      </template>
    </Form>
  </ItemModal>
</template>
