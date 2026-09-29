<script setup lang="ts">
import type { AlarmRuleDefinition } from '#/api/tb/alarm-rule';
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
import { deleteAlarmRule, getAlarmRuleById } from '#/api/tb/alarm-rule';
import { findEntityDataByQuery } from '#/api/tb/entity-query';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import DebugSettingsButton from '#/components/widget/debug-settings-button.vue';
import { alarmSeverityLabel, Authority, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';
import { saveDebugSettings } from '#/utils/debug-settings';
import { exportJsonFile, prepareEntityExport } from '#/utils/import-export';
import ConditionPreview from '#/views/tb/alarm-rule/components/condition-preview-content.vue';

import { scheduleSummary } from './form-data';
import Form from './form.vue';

defineOptions({ name: 'AlarmRuleDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const recordId = computed(() => String(route.params.alarmRuleId ?? ''));
const record = ref<AlarmRuleDefinition>();
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
  { label: $t('alarm-rule.fields.alarmType'), value: record.value?.name },

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

const conditions = computed(() => [
  ...Object.entries(record.value?.configuration.createRules ?? {}).map(
    ([severity, rule]) => ({
      key: severity,
      title: alarmSeverityLabel(severity),
      rule,
    }),
  ),
  ...(record.value?.configuration.clearRule
    ? [
        {
          key: 'clear',
          title: $t('alarm-rule.sections.clearCondition'),
          rule: record.value.configuration.clearRule,
        },
      ]
    : []),
]);
const propagationFields = computed(() => [
  {
    label: $t('alarm-rule.fields.propagate'),
    value: record.value?.configuration.propagate,
  },
  {
    label: $t('alarm-rule.fields.propagateOwner'),
    value: record.value?.configuration.propagateToOwner,
  },
  {
    label: $t('alarm-rule.fields.propagateTenant'),
    value: record.value?.configuration.propagateToTenant,
  },
]);

const headerFields = computed<DetailTag[]>(() => [
  {
    key: 'entityType',
    icon: 'lucide:layers',
    label: $t('alarm-rule.fields.entityType'),
    value: entityTypeLabel(record.value?.entityId?.entityType),
  },
  {
    key: 'entity',
    icon: 'lucide:box',
    label: $t('alarm-rule.fields.entityName'),
    value: entityName.value,
  },
  {
    key: 'severity',
    icon: 'lucide:triangle-alert',
    label: $t('alarm-rule.fields.severity'),
    value: Object.entries(record.value?.configuration.createRules ?? {})
      .filter(([, rule]) => !!rule)
      .map(([severity]) => alarmSeverityLabel(severity))
      .join(' / '),
  },
  {
    key: 'clearCondition',
    icon: 'lucide:check-check',
    label: $t('alarm-rule.sections.clearCondition'),
    value: record.value
      ? $t(
          record.value.configuration.clearRule
            ? 'tb.common.yes'
            : 'tb.common.no',
        )
      : undefined,
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  {
    key: 'debugSettings',
    label: $t('tb.components.debugSettings.menu'),
    icon: 'lucide:bug',
    auth: [Authority.TENANT_ADMIN],
  },
  { key: 'copyId', label: $t('alarm-rule.detail.copyId'), icon: 'lucide:copy' },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('alarm-rule.actions.edit'),
      icon: 'lucide:square-pen',
    },
    {
      key: 'copy',
      label: $t('alarm-rule.actions.copy'),
      icon: 'lucide:copy-plus',
    },
    {
      key: 'export',
      label: $t('alarm-rule.actions.export'),
      icon: 'lucide:download',
    },
    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      label: $t('alarm-rule.actions.delete'),
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
    const info = await getAlarmRuleById(id);
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
  return router.push({ name: 'AlarmRuleList' });
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
        .setData({ alarmRuleId: recordId.value, entityName: entityName.value })
        .open();
    }
    case 'copy': {
      return formModalApi
        .setData({
          value: {
            ...prepareEntityExport(current),
            entityId: undefined,
            name: $t('alarm-rule.messages.copyName', { name: current.name }),
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
      title: $t('alarm-rule.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('alarm-rule.menu'),
        name: current.name,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteAlarmRule(id);
          message.success($t('tb.common.messages.delete.success'));
          if (recordId.value === id)
            await router.replace({ name: 'AlarmRuleList' });
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
    :page-title="$t('alarm-rule.detail.title')"
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
    :error-message="$t('alarm-rule.detail.notFound')"
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
        :entity-label="$t('alarm-rule.menu')"
        @update:model-value="saveDebugSettings(record, $event, 'alarmRule')"
      />
    </template>
    <template #tab-details>
      <div
        v-if="record"
        class="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-2 gap-5 overflow-hidden xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] xl:grid-rows-[minmax(0,1fr)]"
      >
        <Card
          icon="lucide:shield-alert"
          :title="$t('alarm-rule.detail.basic')"
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
                {{ $t('alarm-rule.fields.entityName') }}
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
                  entityName || $t('alarm-rule.detail.nameUnavailable')
                }}</span>
              </dd>
            </div>
          </dl>
          <section
            v-if="record.additionalInfo?.description"
            class="space-y-2 border-t pt-5"
          >
            <h4 class="text-sm text-muted-foreground">
              {{ $t('alarm-rule.detail.description') }}
            </h4>
            <p class="whitespace-pre-wrap break-words text-sm leading-7">
              {{ record.additionalInfo.description }}
            </p>
          </section>
          <section class="space-y-3 border-t pt-5">
            <h4 class="text-sm font-medium">
              {{ $t('alarm-rule.sections.arguments') }}
            </h4>
            <FieldArgumentsDetails :value="record.configuration.arguments" />
          </section>
        </Card>
        <Card
          icon="lucide:settings-2"
          :title="$t('alarm-rule.detail.configuration')"
          content-class="space-y-5"
        >
          <section
            v-for="condition in conditions"
            :key="condition.key"
            class="space-y-3 rounded-lg border p-4"
          >
            <h4 class="text-sm font-medium">{{ condition.title }}</h4>
            <ConditionPreview
              v-if="condition.rule"
              :condition="condition.rule.condition"
            />
            <div v-if="condition.rule" class="space-y-2">
              <p class="text-sm text-muted-foreground">
                {{ $t('alarm-rule.fields.schedule') }}
              </p>
              <p class="text-sm">
                {{ scheduleSummary(condition.rule.condition.schedule) }}
              </p>
            </div>
            <p
              v-if="condition.rule?.alarmDetails"
              class="whitespace-pre-wrap break-words text-sm"
            >
              {{ condition.rule.alarmDetails }}
            </p>
          </section>
          <section class="space-y-3">
            <h4 class="text-sm font-medium">
              {{ $t('alarm-rule.sections.propagation') }}
            </h4>
            <dl class="space-y-3">
              <div
                v-for="field in propagationFields"
                :key="field.label"
                class="flex justify-between gap-4 text-sm"
              >
                <dt class="text-muted-foreground">{{ field.label }}</dt>
                <dd>
                  {{ $t(field.value ? 'tb.common.yes' : 'tb.common.no') }}
                </dd>
              </div>
              <div
                v-if="record.configuration.propagateRelationTypes?.length"
                class="space-y-2 text-sm"
              >
                <dt class="text-muted-foreground">
                  {{ $t('alarm-rule.fields.relationTypes') }}
                </dt>
                <dd class="break-words">
                  {{ record.configuration.propagateRelationTypes.join(', ') }}
                </dd>
              </div>
            </dl>
          </section>
          <details class="rounded-lg border p-4">
            <summary class="cursor-pointer text-sm font-medium">
              {{ $t('alarm-rule.detail.fullConfiguration') }}
            </summary>
            <JsonViewer class="mt-3" :value="record.configuration" expanded />
          </details>
        </Card>
      </div>
    </template>
  </DetailPage>
</template>
