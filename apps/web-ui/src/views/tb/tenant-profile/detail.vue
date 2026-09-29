<script setup lang="ts">
import type { TenantProfile } from '#/api/tb/tenant-profile';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
  DetailTag,
} from '#/components/detail-page';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, JsonViewer, useVbenModal } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

import {
  deleteTenantProfile,
  getTenantProfileById,
  setDefaultTenantProfile,
} from '#/api/tb/tenant-profile';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';
import { exportJsonFile, prepareEntityExport } from '#/utils/import-export';

import { configurationGroups } from './form-data';
import Form from './form.vue';

defineOptions({ name: 'TenantProfileDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const recordId = computed(() => String(route.params.tenantProfileId ?? ''));
const record = ref<TenantProfile>();
const activeTab = ref('details');
const loading = ref(false);
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.SYS_ADMIN] },
  { key: 'attributes', auth: [Authority.SYS_ADMIN] },
  { key: 'telemetry', auth: [Authority.SYS_ADMIN] },
  { key: 'auditLogs', auth: [Authority.SYS_ADMIN] },
];

const basicFields = computed(() => [
  { label: $t('tenant-profile.fields.name'), value: record.value?.name },
  {
    label: $t('tenant-profile.fields.default'),
    value: $t(record.value?.default ? 'tb.common.yes' : 'tb.common.no'),
  },
  {
    label: $t('tenant-profile.fields.isolatedTbRuleEngine'),
    value: $t(
      record.value?.isolatedTbRuleEngine ? 'tb.common.yes' : 'tb.common.no',
    ),
  },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(record.value?.createdTime),
  },
]);
const configuration = computed(() => record.value?.profileData?.configuration);
const queues = computed(
  () => record.value?.profileData?.queueConfiguration ?? [],
);
function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean')
    return $t(value ? 'tb.common.yes' : 'tb.common.no');
  return String(value);
}

const headerFields = computed<DetailTag[]>(() => [
  {
    key: 'isolatedRuleEngine',
    icon: 'lucide:workflow',
    label: $t('tenant-profile.fields.isolatedTbRuleEngine'),
    value:
      typeof record.value?.isolatedTbRuleEngine === 'boolean'
        ? $t(
            record.value.isolatedTbRuleEngine
              ? 'tb.common.yes'
              : 'tb.common.no',
          )
        : undefined,
  },
  {
    key: 'description',
    icon: 'lucide:text',
    label: $t('tenant-profile.fields.description'),
    value: record.value?.description,
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  {
    key: 'copyId',
    label: $t('tenant-profile.detail.copyId'),
    icon: 'lucide:copy',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('tenant-profile.actions.edit'),
      icon: 'lucide:square-pen',
    },
    {
      key: 'export',
      label: $t('tenant-profile.actions.export'),
      icon: 'lucide:download',
    },
    {
      key: 'setDefault',
      label: $t('tenant-profile.actions.setDefault'),
      icon: 'lucide:flag',
      disabled: !!record.value?.default,
    },
    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      label: $t('tenant-profile.actions.delete'),
      icon: 'lucide:trash-2',
      danger: true,
      group: 'delete',
      disabled: !!record.value?.default,
    },
  ],
}));

watch(
  recordId,
  () => {
    record.value = undefined;
    activeTab.value = 'details';
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
    const info = await getTenantProfileById(id);
    if (recordId.value !== id) return;
    record.value = info;
    setBreadcrumbTitle(info.name);
  } catch {
    if (recordId.value === id) record.value = undefined;
  } finally {
    if (recordId.value === id) loading.value = false;
  }
}

function handleBack() {
  return router.push({ name: 'TenantProfileList' });
}

function handleAction(key: string) {
  if (
    !record.value ||
    loading.value ||
    !hasAccessByRoles([Authority.SYS_ADMIN])
  )
    return;
  switch (key) {
    case 'copyId': {
      return copyToClipboard(recordId.value, $t('tb.common.copySuccess'));
    }
    case 'edit': {
      return formModalApi.setData({ tenantProfileId: recordId.value }).open();
    }
    case 'export': {
      const data = prepareEntityExport(record.value);
      data.default = false;
      return exportJsonFile(data, record.value.name);
    }
    case 'setDefault': {
      return handleSetDefault();
    }
    case 'refresh': {
      return loadRecord();
    }
    case 'delete': {
      return handleDelete();
    }
  }
}

async function handleSetDefault() {
  const current = record.value;
  if (!current?.id || current.default) return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('tenant-profile.features.setDefault.title', {
        name: current.name,
      }),
      content: $t('tenant-profile.features.setDefault.content'),
      icon: 'warning',
    });
  } catch {
    return;
  }
  if (recordId.value !== id) return;
  loading.value = true;
  try {
    await setDefaultTenantProfile(id);
    message.success($t('tenant-profile.features.setDefault.success'));
    if (recordId.value === id) await loadRecord();
  } finally {
    if (recordId.value === id) loading.value = false;
  }
}

async function handleDelete() {
  const current = record.value;
  if (!current?.id || current.default) return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('tenant-profile.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('tenant-profile.menu'),
        name: current.name,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteTenantProfile(id);
          message.success($t('tb.common.messages.delete.success'));
          if (recordId.value === id)
            await router.replace({ name: 'TenantProfileList' });
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
    :page-title="$t('tenant-profile.detail.title')"
    :key="recordId"
    v-model:active-tab="activeTab"
    :title="record?.name"
    :status="
      record?.default
        ? { text: $t('tenant-profile.detail.default'), variant: 'success' }
        : undefined
    "
    :tabs="tabs"
    :tags="headerFields"
    :entity-id="record?.id"
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :state="loading ? 'loading' : record ? 'ready' : 'error'"
    :error-message="$t('tenant-profile.detail.notFound')"
    @action="handleAction"
    @retry="loadRecord"
    @back="handleBack"
  >
    <template #modals><FormModal @success="loadRecord" /></template>
    <template #tab-details>
      <div
        v-if="record"
        class="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-2 gap-5 overflow-hidden xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] xl:grid-rows-[minmax(0,1fr)]"
      >
        <Card
          icon="lucide:sliders-horizontal"
          :title="$t('tenant-profile.detail.basic')"
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

            <div class="space-y-2 border-t pt-5 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('tenant-profile.fields.description') }}
              </dt>
              <dd
                class="whitespace-pre-wrap break-words text-sm leading-7"
                :class="!record.description && 'text-muted-foreground'"
              >
                {{
                  record.description ||
                  $t('tenant-profile.detail.noDescription')
                }}
              </dd>
            </div>
          </dl>
          <section
            v-if="record.isolatedTbRuleEngine"
            class="space-y-3 border-t pt-5"
          >
            <h4 class="text-sm font-medium">
              {{
                $t('tenant-profile.sections.groups.queues', {
                  count: queues.length,
                })
              }}
            </h4>
            <details
              v-for="(queue, index) in queues"
              :key="queue.id || index"
              class="rounded-lg border p-3"
            >
              <summary class="cursor-pointer break-all text-sm font-medium">
                {{ queue.name }}
              </summary>
              <JsonViewer :value="queue" class="mt-3" expanded />
            </details>
            <p v-if="!queues.length" class="text-sm text-muted-foreground">—</p>
          </section>
        </Card>
        <Card
          icon="lucide:settings-2"
          :title="$t('tenant-profile.sections.groups.configuration')"
          content-class="space-y-4"
        >
          <details
            v-for="group in configurationGroups"
            :key="group.key"
            class="rounded-lg border p-4"
            :open="group.key === 'entities'"
          >
            <summary class="cursor-pointer text-sm font-medium">
              {{ $t(`tenant-profile.sections.groups.${group.key}`) }}
            </summary>
            <p
              v-if="
                [
                  'entities',
                  'files',
                  'ruleEngine',
                  'storage',
                  'websocket',
                ].includes(group.key)
              "
              class="mt-3 text-xs text-muted-foreground"
            >
              {{ $t('tenant-profile.features.form.zeroMeansUnlimited') }}
            </p>
            <dl class="mt-4 space-y-4">
              <template v-for="key in group.fields" :key="key">
                <div
                  v-if="key !== 'maxSms' || configuration?.smsEnabled !== false"
                  class="space-y-2 text-sm"
                >
                  <dt class="text-muted-foreground">
                    {{ $t(`tenant-profile.features.configuration.${key}`) }}
                  </dt>
                  <dd class="whitespace-pre-wrap break-all font-medium">
                    {{ formatValue(configuration?.[key]) }}
                  </dd>
                </div>
              </template>
            </dl>
          </details>
        </Card>
      </div>
    </template>
  </DetailPage>
</template>
