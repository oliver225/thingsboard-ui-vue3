<script lang="ts" setup>
import type { ArgumentEditorOptions, ArgumentValues } from './data';

import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { EntityId } from '#/types/tb';

import { computed, ref, watch } from 'vue';

import { useVbenModal, VbenButton, VbenTooltip } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import { entityTypeLabel } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';

import {
  getSourceEntityName,
  sourceEntityTypes,
  validateArgumentValues,
} from './data';
import ArgumentForm from './form.vue';

const props = defineProps<
  ArgumentEditorOptions & {
    modelValue: ArgumentValues[];
    disabled?: boolean;
  }
>();
const emit = defineEmits<{ 'update:modelValue': [value: ArgumentValues[]] }>();
const datasource = computed(() => props.modelValue);
const isDisabled = computed(
  () => props.disabled || !props.entityId?.entityType || !props.entityId?.id,
);
const sourceNames = ref<Record<string, string>>({});
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ArgumentForm,
  destroyOnClose: true,
});
const tableColumns = computed<BasicColumn<ArgumentValues>[]>(() => [
  {
    dataIndex: 'name',
    title: $t('tb.components.fieldArguments.fields.argumentName'),
    width: 180,
    slot: 'name',
  },
  {
    dataIndex: 'sourceType',
    ifShow: !props.hideSource,
    title: $t('tb.components.fieldArguments.fields.source'),
    width: 120,
    customRender: ({ record }) => {
      if (record.sourceType === 'CURRENT')
        return $t('tb.components.fieldArguments.options.CURRENT');
      if (record.sourceType === 'CURRENT_OWNER')
        return $t('tb.components.fieldArguments.options.CURRENT_OWNER');
      if (record.sourceType === 'RELATION_PATH_QUERY')
        return $t('tb.components.fieldArguments.options.RELATION_PATH_QUERY');
      return entityTypeLabel(record.sourceType);
    },
  },
  {
    dataIndex: 'sourceId',
    ifShow: !props.hideSource,
    title: $t('tb.components.fieldArguments.fields.targetEntity'),
    width: 120,
    customRender: ({ record }) =>
      record.sourceName ||
      sourceNames.value[`${record.sourceType}:${record.sourceId}`] ||
      record.sourceId ||
      '—',
  },
  {
    dataIndex: 'keyType',
    ifShow: !props.hideKeyType,
    title: $t('tb.components.fieldArguments.fields.keyType'),
    width: 110,
    customRender: ({ record }) =>
      ({
        ATTRIBUTE: $t('tb.components.fieldArguments.options.ATTRIBUTE'),
        TS_LATEST: $t('tb.components.fieldArguments.options.TS_LATEST'),
        TS_ROLLING: $t('tb.components.fieldArguments.options.TS_ROLLING'),
      })[record.keyType],
  },
  {
    dataIndex: 'key',
    title: $t('tb.components.fieldArguments.fields.key'),
    width: 110,
    slot: 'key',
  },
]);
const actionColumn = computed<ActionColumn<ArgumentValues>>(() => ({
  width: 88,
  align: 'center',
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        text: $t('tb.components.fieldArguments.actions.editArgument'),
        tooltip: $t('tb.components.fieldArguments.actions.editArgument'),
        icon: 'lucide:square-pen',
        size: 'icon',
        variant: 'ghost',
        disabled: isDisabled.value,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        text: $t('tb.components.fieldArguments.actions.remove'),
        tooltip: $t('tb.components.fieldArguments.actions.remove'),
        icon: 'lucide:trash-2',
        size: 'icon',
        variant: 'ghost',
        danger: true,
        disabled: isDisabled.value,
        onClick: () => handleDelete(record),
      },
    ],
  }),
}));
const [registerTable] = useTable<ArgumentValues>({
  columns: tableColumns,
  actionColumn,
  dataSource: datasource,
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
const argumentErrors = computed(() =>
  Object.fromEntries(
    datasource.value.map((argument) => [
      argument.rowId,
      validateArgumentValues(
        argument,
        props,
        datasource.value
          .filter((row) => row.rowId !== argument.rowId)
          .map((row) => row.name.trim()),
      )[0]?.message,
    ]),
  ),
);
async function handleCopyName(record: ArgumentValues) {
  if (isDisabled.value || !record.name) return;
  try {
    await copyToClipboard(record.name, $t('tb.common.copySuccess'));
  } catch {
    message.error(
      $t('tb.components.fieldArguments.messages.copyArgumentFailed'),
    );
  }
}
function handleEdit(record?: ArgumentValues) {
  if (isDisabled.value) return;
  formModalApi
    .setData({
      ...props,
      value: record,
      usedNames: datasource.value
        .filter((argument) => argument.rowId !== record?.rowId)
        .map((argument) => argument.name.trim()),
    })
    .open();
}
function handleDelete(record: ArgumentValues) {
  if (!isDisabled.value)
    emit(
      'update:modelValue',
      datasource.value.filter((argument) => argument.rowId !== record.rowId),
    );
}
function onSuccess(value: ArgumentValues) {
  if (isDisabled.value) return;
  const index = datasource.value.findIndex(
    (argument) => argument.rowId === value.rowId,
  );
  emit(
    'update:modelValue',
    index === -1
      ? [...datasource.value, value]
      : datasource.value.toSpliced(index, 1, value),
  );
}
watch(isDisabled, (disabled) => {
  if (disabled) formModalApi.close();
});
watch(
  datasource,
  async (argumentValues, _, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    const entities = new Map<string, EntityId>();
    for (const argument of argumentValues) {
      const entityType = sourceEntityTypes.find(
        (type) => type === argument.sourceType,
      );
      const key = `${argument.sourceType}:${argument.sourceId}`;
      if (
        entityType &&
        argument.sourceId &&
        !argument.sourceName &&
        !sourceNames.value[key]
      )
        entities.set(key, { entityType, id: argument.sourceId });
    }
    const results = await Promise.allSettled(
      [...entities].map(async ([key, entityId]) => ({
        key,
        name: await getSourceEntityName(entityId),
      })),
    );
    if (cancelled) return;
    for (const result of results)
      if (result.status === 'fulfilled')
        sourceNames.value[result.value.key] = result.value.name;
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="w-full min-w-0">
    <p
      v-if="datasource.length === 0"
      class="text-destructive text-center text-sm"
    >
      {{ $t('tb.components.fieldArguments.validation.arguments') }}
    </p>
    <BasicTable v-else @register="registerTable">
      <template #name="{ record }">
        <div class="flex min-w-0 items-center gap-1">
          <span class="min-w-0 truncate" :title="record.name">{{
            record.name
          }}</span>
          <VbenTooltip>
            <template #trigger>
              <VbenButton
                type="button"
                variant="ghost"
                size="icon"
                class="text-muted-foreground hover:text-foreground size-7 shrink-0"
                :aria-label="
                  $t('tb.components.fieldArguments.actions.copyArgumentName', {
                    name: record.name,
                  })
                "
                @click.stop="handleCopyName(record)"
              >
                <IconifyIcon
                  icon="lucide:copy"
                  class="size-3.5"
                  aria-hidden="true"
                />
              </VbenButton>
            </template>
            {{
              $t('tb.components.fieldArguments.actions.copyArgumentName', {
                name: record.name,
              })
            }}
          </VbenTooltip>
        </div>
        <p
          v-if="argumentErrors[record.rowId]"
          class="text-destructive mt-1 whitespace-normal text-xs"
        >
          {{ argumentErrors[record.rowId] }}
        </p>
      </template>
      <template #key="{ record }">
        <span
          class="bg-muted inline-block max-w-full truncate rounded-full px-3 py-1 align-middle"
          >{{ record.key }}</span>
      </template>
    </BasicTable>
    <VbenButton
      type="button"
      variant="outline"
      size="sm"
      class="mt-3"
      :disabled="
        isDisabled || (!!maxArguments && datasource.length >= maxArguments)
      "
      @click="handleEdit()"
    >
      <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />{{
        $t('tb.components.fieldArguments.actions.addArgument')
      }}
    </VbenButton>
    <FormModal @success="onSuccess" />
  </div>
</template>
