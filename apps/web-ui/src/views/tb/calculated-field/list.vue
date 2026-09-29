<script setup lang="ts">
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type {
  CalculatedField,
  CalculatedFieldInfo,
} from '#/api/tb/calculated-field';
import type { EntityId } from '#/types/tb';

import { computed, reactive, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal, VbenIconButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { VbenTableAction } from '@vben-core/shadcn-ui';

import { Button, Input, message } from 'antdv-next';

import { EntityInput } from '#/adapter/component';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteCalculatedField,
  deleteCalculatedFields,
  getCalculatedFieldById,
  getCalculatedFields,
  getCalculatedFieldsByEntityId,
} from '#/api/tb/calculated-field';
import DebugSettingsButton from '#/components/widget/debug-settings-button.vue';
import {
  Authority,
  CalculatedFieldType,
  calculatedFieldTypeLabel,
  EntityType,
  entityTypeLabel,
} from '#/enums';
import { $t } from '#/locales';
import { saveDebugSettings } from '#/utils/debug-settings';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import {
  calculatedFieldTypes,
  getEntityTypeOptions,
  getTypeOptions,
} from './form-data';
import CalculatedFieldForm from './form.vue';

defineOptions({ name: 'CalculatedFieldList' });
const props = defineProps<{ entityId?: EntityId }>();

const { hasAccessByRoles } = useAccess();
const router = useRouter();

const searchInfo = reactive({
  searchText: '',
  entityType: undefined as EntityType | undefined,
  entities: [] as string[],
});

const typeOptions = computed(getTypeOptions);

const entityTypeOptions = computed(getEntityTypeOptions);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: CalculatedFieldForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<CalculatedFieldInfo>[]>(() => [
  {
    title: $t('calculated-fields.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 220,
    sorter: true,
    slot: 'fieldName',
  },
  {
    key: 'entityType',
    ifShow: !props.entityId,
    title: $t('calculated-fields.fields.entityType'),
    width: 150,
    filters: entityTypeOptions.value.map(({ label, value }) => ({
      text: label,
      value,
    })),
    filterMultiple: false,
    customRender: ({ record }) => entityTypeLabel(record.entityId?.entityType),
  },
  {
    title: $t('calculated-fields.fields.entityName'),
    dataIndex: 'entityName',
    key: 'entityName',
    ifShow: !props.entityId,
    width: 220,
  },
  {
    title: $t('calculated-fields.fields.type'),
    dataIndex: 'type',
    key: 'types',
    width: 200,
    filters: typeOptions.value.map(({ label, value }) => ({
      text: label,
      value,
    })),
    ifShow: !props.entityId,
    customRender: ({ value }) => calculatedFieldTypeLabel(value),
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<CalculatedFieldInfo> = {
  align: 'center',
  width: 260,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'copy',
        icon: 'lucide:copy-plus',
        text: $t('calculated-fields.actions.copy'),
        tooltip: $t('calculated-fields.actions.copy'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleCopy(record),
      },
      {
        key: 'export',
        icon: 'lucide:download',
        text: $t('calculated-fields.actions.export'),
        tooltip: $t('calculated-fields.actions.export'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleExport(record),
      },
      {
        key: 'events',
        icon: 'lucide:scroll-text',
        text: $t('detail-page.tabs.events'),
        tooltip: $t('detail-page.tabs.events'),
        auth: Authority.TENANT_ADMIN,
        onClick: () =>
          router.push({
            name: 'CalculatedFieldDetail',
            params: { calculatedFieldId: record.id?.id },
            query: { tab: 'events' },
          }),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('calculated-fields.actions.edit'),
        tooltip: $t('calculated-fields.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('calculated-fields.actions.delete'),
        tooltip: $t('calculated-fields.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<CalculatedFieldInfo>({
  api: (params) =>
    props.entityId
      ? getCalculatedFieldsByEntityId(props.entityId, params)
      : getCalculatedFields(params),
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('calculated-fields.menu'),
    enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteCalculatedFields,
  },
  tableSetting: { redo: true, setting: true, size: true },
  filterFn: handleFilterChange,
});

watch(() => searchInfo.searchText, handleSearch);
watch(
  [() => props.entityId?.id, () => props.entityId?.entityType],
  handleSearch,
);

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: CalculatedFieldInfo) {
  if (!record.id?.id) return;
  formModalApi
    .setData({ calculatedFieldId: record.id.id, entityName: record.entityName })
    .open();
}

async function handleImport() {
  let value: CalculatedField;
  try {
    value = await importJsonFile<CalculatedField>();
  } catch {
    message.error($t('calculated-fields.validation.import'));
    return;
  }
  if (
    !value ||
    !calculatedFieldTypes.includes(value.type) ||
    !value.configuration ||
    typeof value.configuration !== 'object' ||
    Array.isArray(value.configuration)
  ) {
    message.error($t('calculated-fields.validation.import'));
    return;
  }
  formModalApi
    .setData({ value: { ...prepareEntityImport(value), entityId: undefined } })
    .open();
}

async function handleExport(record: CalculatedFieldInfo) {
  if (!record.id?.id) return;
  const value = await getCalculatedFieldById(record.id.id);
  exportJsonFile(
    { ...prepareEntityExport(value), entityId: undefined },
    value.name,
  );
}

async function handleCopy(record: CalculatedFieldInfo) {
  if (!record.id?.id) return;
  const value = prepareEntityExport(await getCalculatedFieldById(record.id.id));
  formModalApi
    .setData({
      value: {
        ...value,
        entityId: undefined,
        name: $t('calculated-fields.messages.copyName', { name: value.name }),
      },
    })
    .open();
}

async function handleDelete(record: CalculatedFieldInfo) {
  const calculatedFieldId = record.id?.id;
  if (!calculatedFieldId) return;
  await confirm({
    title: $t('calculated-fields.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('calculated-fields.menu'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteCalculatedField(calculatedFieldId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleFilterChange(filters: {
  entityType?: EntityType[] | null;
  types?: CalculatedFieldType[] | null;
}) {
  const entityType = filters.entityType?.[0];
  if (entityType !== searchInfo.entityType) {
    searchInfo.entityType = entityType;
    searchInfo.entities = [];
  }
  return { types: filters.types ?? [], entityType };
}

function handleSaved() {
  return reload();
}
</script>
<template>
  <component
    :is="entityId ? 'section' : Page"
    :auto-content-height="!entityId"
    :class="
      entityId &&
      'flex min-h-96 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card'
    "
  >
    <FormModal :entity-id="entityId" @success="handleSaved" />
    <BasicTable
      :title-icon="entityId ? undefined : $route.meta.icon"
      class="h-full"
      :title="entityId ? undefined : $t('tb.menu.calculatedField')"
      @register="registerTable"
    >
      <template #query>
        <EntityInput
          class="w-full sm:w-48 sm:max-w-full"
          v-if="!entityId && searchInfo.entityType"
          v-model="searchInfo.entities"
          multiple
          show-search
          :max-tag-count="1"
          :key="searchInfo.entityType"
          :entity-type="searchInfo.entityType"
          :placeholder="$t('calculated-fields.features.filter.entities')"
          @change="handleSearch"
        />
        <Input
          v-model:value="searchInfo.searchText"
          class="w-full sm:w-80 sm:max-w-full"
          allow-clear
          :aria-label="$t('tb.common.search')"
          :placeholder="$t('tb.common.searchPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon
              icon="lucide:search"
              class="text-muted-foreground size-4"
              aria-hidden="true"
            />
          </template>
        </Input>
      </template>
      <template #toolbar>
        <Button
          v-access:role="[Authority.TENANT_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('calculated-fields.actions.create') }}
        </Button>
        <VbenIconButton
          v-access:role="[Authority.TENANT_ADMIN]"
          :tooltip="$t('calculated-fields.actions.import')"
          :aria-label="$t('calculated-fields.actions.import')"
          tooltip-side="top"
          class="rounded-md border border-border"
          @click="handleImport"
        >
          <IconifyIcon
            icon="lucide:file-up"
            class="size-4"
            aria-hidden="true"
          />
        </VbenIconButton>
      </template>
      <template #fieldName="{ record }">
        <RouterLink
          :to="{
            name: 'CalculatedFieldDetail',
            params: { calculatedFieldId: record.id.id },
          }"
          class="text-primary hover:underline"
        >
          {{ record.name }}
        </RouterLink>
      </template>
      <template #tableActions="{ record, actionProps }">
        <div class="flex items-center justify-center gap-1">
          <DebugSettingsButton
            icon-only
            v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
            :model-value="record.debugSettings"
            :entity-label="$t('calculated-fields.menu')"
            @update:model-value="
              saveDebugSettings(record, $event, 'calculatedField')
            "
          />
          <VbenTableAction v-bind="actionProps" />
        </div>
      </template>
    </BasicTable>
  </component>
</template>
