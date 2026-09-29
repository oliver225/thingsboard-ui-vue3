<script setup lang="ts">
import type {
  CalculatedField,
  CalculatedFieldConfiguration,
} from '#/api/tb/calculated-field';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
  DetailTag,
} from '#/components/detail-page';

import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, JsonViewer, useVbenModal } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

import FieldArgumentsDetails from '#/adapter/component/field-arguments/details.vue';
import {
  deleteCalculatedField,
  getCalculatedFieldById,
} from '#/api/tb/calculated-field';
import { findEntityDataByQuery } from '#/api/tb/entity-query';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import DebugSettingsButton from '#/components/widget/debug-settings-button.vue';
import {
  Authority,
  CalculatedFieldType,
  calculatedFieldTypeLabel,
  entityTypeLabel,
} from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';
import { saveDebugSettings } from '#/utils/debug-settings';
import { exportJsonFile, prepareEntityExport } from '#/utils/import-export';

import Form from './form.vue';

defineOptions({ name: 'CalculatedFieldDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const recordId = computed(() => String(route.params.calculatedFieldId ?? ''));
const record = ref<CalculatedField>();
const entityName = ref('');
const activeTab = computed({
  get: () => (route.query.tab === 'events' ? 'events' : 'details'),
  set: (tab: string) => {
    void router.replace({ query: { ...route.query, tab } });
  },
});
const loading = ref(false);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.TENANT_ADMIN] },
  { key: 'events', auth: [Authority.TENANT_ADMIN] },
];
const basicFields = computed(() => [
  { label: $t('calculated-fields.fields.name'), value: record.value?.name },
  {
    label: $t('calculated-fields.fields.type'),
    value: calculatedFieldTypeLabel(record.value?.type),
  },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(record.value?.createdTime),
  },
]);
const entityRoute = computed(() => {
  const entity = record.value?.entityId;
  if (!entity) return undefined;
  const type = entity.entityType
    .toLowerCase()
    .replaceAll(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  const target = {
    name: `${type.charAt(0).toUpperCase()}${type.slice(1)}Detail`,
    params: { [`${type}Id`]: entity.id },
  };
  return router.hasRoute(target.name) ? target : undefined;
});

const configuration = computed(
  () => record.value?.configuration as CalculatedFieldConfiguration | undefined,
);
const outputFields = computed(() =>
  [
    {
      label: $t('calculated-fields.fields.outputType'),
      value: configuration.value?.output?.type
        ? $t(`calculated-fields.options.${configuration.value.output.type}`)
        : undefined,
    },
    {
      label: $t('calculated-fields.fields.outputKey'),
      value: configuration.value?.output?.name,
    },
    {
      label: $t('calculated-fields.fields.scope'),
      value: configuration.value?.output?.scope
        ? $t(`calculated-fields.options.${configuration.value.output.scope}`)
        : undefined,
    },
    {
      label: $t('calculated-fields.sections.strategy'),
      value: configuration.value?.output?.strategy?.type
        ? $t(
            `calculated-fields.options.${configuration.value.output.strategy.type}`,
          )
        : undefined,
    },
  ].filter((field) => field.value !== undefined),
);

const headerFields = computed<DetailTag[]>(() => [
  {
    key: 'entityType',
    icon: 'lucide:layers',
    label: $t('calculated-fields.fields.entityType'),
    value: entityTypeLabel(record.value?.entityId?.entityType),
  },
  {
    key: 'entity',
    icon: 'lucide:box',
    label: $t('calculated-fields.fields.entityName'),
    value: entityName.value,
  },
  {
    key: 'type',
    icon: 'lucide:square-function',
    label: $t('calculated-fields.fields.type'),
    value: calculatedFieldTypeLabel(record.value?.type),
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  {
    key: 'debugSettings',
    label: $t('tb.components.debugSettings.menu'),
    icon: 'lucide:bug',
    auth: [Authority.TENANT_ADMIN],
  },
  {
    key: 'copyId',
    label: $t('calculated-fields.detail.copyId'),
    icon: 'lucide:copy',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('calculated-fields.actions.edit'),
      icon: 'lucide:square-pen',
    },
    {
      key: 'copy',
      label: $t('calculated-fields.actions.copy'),
      icon: 'lucide:copy-plus',
    },
    {
      key: 'export',
      label: $t('calculated-fields.actions.export'),
      icon: 'lucide:download',
    },
    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      label: $t('calculated-fields.actions.delete'),
      icon: 'lucide:trash-2',
      danger: true,
      group: 'delete',
    },
  ],
}));

watch(
  recordId,
  () => {
    record.value = undefined;
    entityName.value = '';
    resetBreadcrumbTitle();
    void loadRecord();
  },
  { immediate: true },
);

async function loadRecord() {
  const id = recordId.value;
  if (!id) return;
  loading.value = true;
  try {
    const info = await getCalculatedFieldById(id);
    if (recordId.value !== id) return;
    const name = info.entityId
      ? await findEntityDataByQuery({
          entityFilter: { type: 'singleEntity', singleEntity: info.entityId },
          entityFields: [{ type: 'ENTITY_FIELD', key: 'name' }],
          pageLink: { page: 0, pageSize: 1 },
        })
          .then(({ data }) => data[0]?.latest.ENTITY_FIELD?.name?.value ?? '')
          .catch(() => '')
      : '';
    if (recordId.value !== id) return;
    record.value = info;
    entityName.value = name;
    setBreadcrumbTitle(info.name);
  } catch {
    if (recordId.value === id) record.value = undefined;
  } finally {
    if (recordId.value === id) loading.value = false;
  }
}

function handleBack() {
  return router.push({ name: 'CalculatedFieldList' });
}

function handleAction(key: string) {
  const current = record.value;
  if (!current || loading.value || !hasAccessByRoles([Authority.TENANT_ADMIN]))
    return;
  switch (key) {
    case 'copyId': {
      return copyToClipboard(recordId.value, $t('tb.common.copySuccess'));
    }
    case 'edit': {
      return formModalApi
        .setData({
          calculatedFieldId: recordId.value,
          entityName: entityName.value,
        })
        .open();
    }
    case 'copy': {
      return formModalApi
        .setData({
          value: {
            ...prepareEntityExport(current),
            entityId: undefined,
            name: $t('calculated-fields.messages.copyName', {
              name: current.name,
            }),
          },
        })
        .open();
    }
    case 'export': {
      return exportJsonFile(
        { ...prepareEntityExport(current), entityId: undefined },
        current.name,
      );
    }
    case 'refresh': {
      return loadRecord();
    }
    case 'delete': {
      return handleDelete();
    }
  }
}

async function handleDelete() {
  const current = record.value;
  if (!current?.id) return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('calculated-fields.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('calculated-fields.menu'),
        name: current.name,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteCalculatedField(id);
          message.success($t('tb.common.messages.delete.success'));
          if (recordId.value === id)
            await router.replace({ name: 'CalculatedFieldList' });
          return true;
        } catch {
          return false;
        } finally {
          if (recordId.value === id) loading.value = false;
        }
      },
    });
  } catch {}
}
</script>

<template>
  <DetailPage
    :page-title="$t('calculated-fields.detail.title')"
    :key="recordId"
    v-model:active-tab="activeTab"
    :title="record?.name"
    :tabs="tabs"
    :tags="headerFields"
    :entity-id="record?.id"
    :event-types="['DEBUG_CALCULATED_FIELD']"
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :state="loading ? 'loading' : record ? 'ready' : 'error'"
    :error-message="$t('calculated-fields.detail.notFound')"
    @action="handleAction"
    @retry="loadRecord"
    @back="handleBack"
  >
    <template #modals>
      <FormModal @success="loadRecord" />
    </template>
    <template #action-debugSettings="{ action, disabled }">
      <DebugSettingsButton
        :label="action.label"
        :model-value="record?.debugSettings"
        :disabled="disabled"
        :entity-label="$t('calculated-fields.menu')"
        @update:model-value="
          saveDebugSettings(record, $event, 'calculatedField')
        "
      />
    </template>
    <template #tab-details>
      <div
        v-if="record"
        class="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-2 gap-5 overflow-hidden xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] xl:grid-rows-[minmax(0,1fr)]"
      >
        <Card
          icon="lucide:square-function"
          :title="$t('calculated-fields.detail.basic')"
          content-class="space-y-5"
        >
          <dl class="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div
              v-for="field in basicFields"
              :key="field.label"
              class="space-y-2"
            >
              <dt class="text-sm text-muted-foreground">{{ field.label }}</dt>
              <dd class="break-all text-sm font-medium">
                {{ field.value || '—' }}
              </dd>
            </div>
            <div v-if="record.entityId" class="space-y-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('calculated-fields.fields.entityName') }}
              </dt>
              <dd class="flex flex-wrap items-center gap-2 text-sm">
                <span class="text-muted-foreground">{{
                  entityTypeLabel(record.entityId.entityType)
                }}</span>
                <RouterLink
                  v-if="entityRoute && entityName"
                  :to="entityRoute"
                  class="break-all font-medium text-primary hover:underline"
                >
                  {{ entityName }}
                </RouterLink>
                <span v-else>{{
                  entityName || $t('calculated-fields.detail.nameUnavailable')
                }}</span>
              </dd>
            </div>
          </dl>
          <section
            v-if="record.additionalInfo?.description"
            class="space-y-2 border-t pt-5"
          >
            <h4 class="text-sm text-muted-foreground">
              {{ $t('calculated-fields.detail.description') }}
            </h4>
            <p class="whitespace-pre-wrap break-words text-sm leading-7">
              {{ record.additionalInfo.description }}
            </p>
          </section>
          <section class="space-y-3 border-t pt-5">
            <h4 class="text-sm font-medium">
              {{ $t('calculated-fields.sections.arguments') }}
            </h4>
            <FieldArgumentsDetails :value="configuration?.arguments" />
          </section>
        </Card>
        <Card
          icon="lucide:settings-2"
          :title="$t('calculated-fields.detail.configuration')"
          content-class="space-y-5"
        >
          <section v-if="configuration?.expression" class="space-y-3">
            <h4 class="text-sm font-medium">
              {{
                $t(
                  record.type === CalculatedFieldType.SCRIPT
                    ? 'calculated-fields.sections.script'
                    : 'calculated-fields.sections.expression',
                )
              }}
            </h4>
            <pre
              class="overflow-x-auto rounded-lg bg-muted/50 p-4 text-sm leading-6"
              >{{ configuration.expression }}</pre>
          </section>
          <section v-if="outputFields.length" class="space-y-3">
            <h4 class="text-sm font-medium">
              {{ $t('calculated-fields.sections.output') }}
            </h4>
            <dl class="grid gap-4 sm:grid-cols-2">
              <div
                v-for="field in outputFields"
                :key="field.label"
                class="space-y-2 text-sm"
              >
                <dt class="text-muted-foreground">{{ field.label }}</dt>
                <dd class="break-all font-medium">{{ field.value }}</dd>
              </div>
            </dl>
          </section>
          <details class="rounded-lg border p-4">
            <summary class="cursor-pointer text-sm font-medium">
              {{ $t('calculated-fields.detail.fullConfiguration') }}
            </summary>
            <JsonViewer class="mt-3" :value="record.configuration" expanded />
          </details>
        </Card>
      </div>
    </template>
  </DetailPage>
</template>
