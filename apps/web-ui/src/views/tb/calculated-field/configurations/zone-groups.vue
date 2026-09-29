<script lang="ts">
import type { ZoneValues as ZoneRow } from '../form-data';

import { sourceEntityTypes as zoneSourceTypes } from '#/adapter/component/field-arguments/data';
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
export function validateZoneValues(
  row: ZoneRow,
  maxRelationLevel?: number,
  usedNames: string[] = [],
): RowIssue[] {
  const issues = validateRowName(row.name, usedNames);
  const fail = (fieldName: string, key: string, params = {}) =>
    issues.push({
      fieldName,
      message: translate(`calculated-fields.validation.${key}`, params),
    });
  if (
    zoneSourceTypes.some((type) => type === row.sourceType) &&
    !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(row.sourceId)
  )
    fail('sourceId', 'entity');
  if (row.sourceType === 'RELATION_PATH_QUERY') {
    if (row.levels.length === 0) fail('sourceType', 'relationPath');
    if (maxRelationLevel && row.levels.length > maxRelationLevel)
      fail('sourceType', 'maxItems', { count: maxRelationLevel });
    row.levels.forEach((level, index) => {
      if (!level.relationType.trim())
        fail(`levels[${index}].relationType`, 'required');
    });
  }
  if (!row.perimeterKeyName.trim()) fail('perimeterKeyName', 'required');
  else if (!/^\s*\S+(?:\s\S+)*\s*$/.test(row.perimeterKeyName))
    fail('perimeterKeyName', 'perimeterKey');
  if (row.createRelationsWithMatchedZones && !row.relationType.trim())
    fail('relationType', 'required');
  return issues;
}
</script>

<script setup lang="ts">
import type { ZoneValues } from '../form-data';

import type { VbenFormSchema } from '#/adapter/form';
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TbUserInfo } from '#/api/core/user';
import type { EntityId } from '#/types/tb';

import { computed, markRaw, nextTick, ref, watch } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { cloneDeep } from '@vben/utils';

import KeyInput from '#/adapter/component/entity-key-input.vue';
import {
  sourceEntityTypes,
  sourceOptions,
} from '#/adapter/component/field-arguments/data';
import { useVbenForm } from '#/adapter/form';
import FormField from '#/adapter/form-field.vue';
import { BasicTable, useTable } from '#/adapter/table';
import { EntityType, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';

import { createDefaultZoneFormValues } from '../form-data';
const props = defineProps<{
  modelValue: ZoneValues[];
  validationField?: string;
  entityId: EntityId;
  ownerId?: EntityId;
  entityName?: string;
  maxRelationLevel?: number;
  maxItems?: number;
}>();
const emit = defineEmits<{ 'update:modelValue': [rows: ZoneValues[]] }>();
const userStore = useUserStore();
const tenantId = computed(
  () => (userStore.userInfo as null | TbUserInfo)?.tbUser?.tenantId?.id ?? '',
);
const rows = computed(() => props.modelValue);
const disabled = computed(
  () => !props.entityId.entityType || !props.entityId.id,
);
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
const columns = computed<BasicColumn<ZoneValues>[]>(() => [
  {
    dataIndex: 'name',
    title: $t('calculated-fields.fields.zoneName'),
    width: 160,
    slot: 'name',
  },
  {
    dataIndex: 'sourceType',
    title: $t('calculated-fields.fields.source'),
    width: 120,
    customRender: ({ record }) =>
      sourceEntityTypes.some((type) => type === record.sourceType)
        ? entityTypeLabel(record.sourceType)
        : $t(`calculated-fields.options.${record.sourceType}`),
  },
  {
    dataIndex: 'perimeterKeyName',
    title: $t('calculated-fields.fields.perimeterKeyName'),
    width: 160,
  },
  {
    dataIndex: 'reportStrategy',
    title: $t('calculated-fields.fields.reportStrategy'),
    width: 220,
    customRender: ({ record }) =>
      $t(`calculated-fields.options.${record.reportStrategy}`),
  },
]);
const [Form, formApi] = useVbenForm<ZoneValues & { _configuration?: string }>({
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
});
async function handleChange(field: string, value: unknown) {
  await formApi.setFieldValue(field, value);
  await formApi.clearValidation();
}

const [ItemModal, itemModalApi] = useVbenModal<{ rowId?: string }>({
  async onOpenChange(open) {
    if (!open) {
      isReady.value = false;
      return;
    }
    editingId.value = itemModalApi.getData()?.rowId;
    const row = rows.value.find((row) => row.rowId === editingId.value);
    itemModalApi.setState({
      title: $t('calculated-fields.sections.zoneSettings'),
      confirmText: row
        ? $t('tb.common.save')
        : $t('calculated-fields.actions.addZone'),
    });
    const draft = cloneDeep(row ?? createDefaultZoneFormValues());
    if (draft.sourceType === EntityType.TENANT) draft.sourceId = tenantId.value;
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
    const issues = validateZoneValues(
      row,
      props.maxRelationLevel,
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
const actionColumn = computed<ActionColumn<ZoneValues>>(() => ({
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
const [registerTable] = useTable<ZoneValues>({
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
      validateZoneValues(
        row,
        props.maxRelationLevel,
        rows.value.slice(0, index).map((other) => other.name.trim()),
      )[0]?.message,
    ]),
  ),
);
function handleEdit(row?: ZoneValues) {
  if (!disabled.value && (row || canAdd.value))
    itemModalApi.setData({ rowId: row?.rowId }).open();
}
function handleDelete(row: ZoneValues) {
  if (!disabled.value)
    emit(
      'update:modelValue',
      rows.value.filter((other) => other.rowId !== row.rowId),
    );
}
function onSuccess(row: ZoneValues) {
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
    if (!field?.startsWith('zones[')) return;
    const match = field.match(/\[(\d+)\]/);
    const row = match && rows.value[Number(match[1])];
    if (row) handleEdit(row);
  },
);
function getFields(row: ZoneValues): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      component: 'VbenInput',
      label: $t('calculated-fields.fields.zoneName'),
      rules: 'required',
      componentProps: { maxlength: 255 },
    },
    {
      fieldName: 'sourceType',
      component: 'Select',
      label: $t('calculated-fields.fields.source'),
      rules: 'selectRequired',
      componentProps: {
        options: sourceOptions(true),
        onChange: (sourceType: string) => {
          void formApi.setValues({
            sourceId: sourceType === EntityType.TENANT ? tenantId.value : '',
            perimeterKeyName: '',
          });
        },
      },
    },
    ...(row.sourceType !== EntityType.TENANT &&
    sourceEntityTypes.some((type) => type === row.sourceType)
      ? [
          {
            fieldName: 'sourceId',
            component: 'EntityInput',
            label: $t('calculated-fields.fields.sourceEntity'),
            rules: 'required',
            componentProps: {
              entityType: sourceEntityTypes.find(
                (type) => type === row.sourceType,
              ),
              key: row.sourceType,
              showSearch: true,
            },
          },
        ]
      : []),
    {
      fieldName: 'perimeterKeyName',
      component: markRaw(KeyInput),
      modelPropName: 'value',
      label: $t('calculated-fields.fields.perimeterKeyName'),
      help: $t('calculated-fields.features.geofencing.perimeterHelp'),
      rules: 'required',
      componentProps: {
        entityType: props.entityId.entityType,
        entityId: props.entityId.id,
        entityName: props.entityName,
        ownerId: props.ownerId,
        sourceType:
          row.sourceType === 'RELATION_PATH_QUERY' ? 'CURRENT' : row.sourceType,
        sourceId: row.sourceId,
        keyType: 'ATTRIBUTE',
        scope: 'SERVER_SCOPE',
      },
    },
    {
      fieldName: 'reportStrategy',
      component: 'VbenSelect',
      label: $t('calculated-fields.fields.reportStrategy'),
      help: $t('calculated-fields.features.geofencing.reportHelp'),
      rules: 'selectRequired',
      componentProps: {
        options: [
          'REPORT_TRANSITION_EVENTS_AND_PRESENCE_STATUS',
          'REPORT_PRESENCE_STATUS_ONLY',
          'REPORT_TRANSITION_EVENTS_ONLY',
        ].map((value) => ({
          value,
          label: $t(`calculated-fields.options.${value}`),
        })),
      },
    },
    {
      fieldName: 'createRelationsWithMatchedZones',
      component: 'TbSwitch',
      hideLabel: true,
      formItemClass: 'sm:col-span-2 pb-2',
      componentProps: {
        title: $t('calculated-fields.fields.createRelationsWithMatchedZones'),
        help: $t('calculated-fields.features.geofencing.createRelationsHelp'),
        class: 'bg-muted/40',
      },
    },
    ...(row.createRelationsWithMatchedZones
      ? [
          {
            fieldName: 'direction',
            component: 'VbenSelect',
            label: $t('calculated-fields.fields.direction'),
            rules: 'selectRequired',
            componentProps: {
              options: ['FROM', 'TO'].map((value) => ({
                value,
                label: $t(
                  `calculated-fields.features.geofencing.direction.${value}`,
                ),
              })),
            },
          },
          {
            fieldName: 'relationType',
            component: 'VbenInput',
            label: $t('calculated-fields.fields.relationType'),
            rules: 'required',
            componentProps: { maxlength: 255 },
          },
        ]
      : []),
  ];
}
function handleAddLevel(row: ZoneValues) {
  void handleChange('levels', [
    ...row.levels,
    { direction: 'TO', relationType: '' },
  ]);
}
function handleMoveLevel(row: ZoneValues, index: number, offset: number) {
  const levels = [...row.levels];
  const target = index + offset;
  if (target < 0 || target >= levels.length) return;
  const [level] = levels.splice(index, 1);
  if (level) levels.splice(target, 0, level);
  void handleChange('levels', levels);
}
</script>
<template>
  <div class="w-full min-w-0">
    <p v-if="!rows.length" class="text-destructive text-center text-sm">
      {{ $t('calculated-fields.validation.zones') }}
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
      {{ $t('calculated-fields.actions.addZone') }}
    </VbenButton>
    <p v-if="!canAdd && !disabled" class="text-muted-foreground mt-2 text-xs">
      {{ $t('calculated-fields.features.geofencing.maxZones') }}
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

          <div
            v-if="formValues.sourceType === 'RELATION_PATH_QUERY'"
            class="space-y-2"
          >
            <div
              v-for="(_, levelIndex) in formValues.levels"
              :key="levelIndex"
              class="grid grid-cols-[1fr_1fr_auto] items-start gap-3"
            >
              <FormField
                :schema="{
                  fieldName: `levels[${levelIndex}].direction`,
                  component: 'VbenSelect',
                  label: $t(
                    'calculated-fields.features.geofencing.directionLabel',
                  ),
                  rules: 'selectRequired',
                  componentProps: {
                    options: ['FROM', 'TO'].map((value) => ({
                      value,
                      label: $t(
                        `calculated-fields.features.geofencing.levelDirection.${value}`,
                      ),
                    })),
                  },
                }"
              />
              <FormField
                :schema="{
                  fieldName: `levels[${levelIndex}].relationType`,
                  component: 'VbenInput',
                  label: $t('calculated-fields.fields.relationType'),
                  rules: 'required',
                  componentProps: { maxlength: 255 },
                }"
              />
              <div class="mt-7 flex items-center">
                <VbenButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  :disabled="levelIndex === 0"
                  :aria-label="
                    $t(
                      'calculated-fields.features.geofencing.levelDirection.TO',
                    )
                  "
                  @click="handleMoveLevel(formValues, levelIndex, -1)"
                >
                  <IconifyIcon icon="lucide:arrow-up" class="size-4" />
                </VbenButton>
                <VbenButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  :disabled="levelIndex === formValues.levels.length - 1"
                  :aria-label="
                    $t(
                      'calculated-fields.features.geofencing.levelDirection.FROM',
                    )
                  "
                  @click="handleMoveLevel(formValues, levelIndex, 1)"
                >
                  <IconifyIcon icon="lucide:arrow-down" class="size-4" />
                </VbenButton>
                <VbenButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  :aria-label="$t('calculated-fields.actions.remove')"
                  @click="
                    handleChange(
                      `levels`,
                      formValues.levels.filter(
                        (_, index) => index !== levelIndex,
                      ),
                    )
                  "
                >
                  <IconifyIcon icon="lucide:x" class="size-4" />
                </VbenButton>
              </div>
            </div>
            <VbenButton
              type="button"
              variant="outline"
              size="sm"
              :disabled="
                !!maxRelationLevel &&
                formValues.levels.length >= maxRelationLevel
              "
              @click="handleAddLevel(formValues)"
            >
              {{ $t('calculated-fields.actions.addLevel') }}
            </VbenButton>
          </div>
        </div>
      </template>
    </Form>
  </ItemModal>
</template>
