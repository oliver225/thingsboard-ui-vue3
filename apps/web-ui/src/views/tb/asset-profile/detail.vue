<script setup lang="ts">
import type { AssetProfile } from '#/api/tb/asset-profile';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
  DetailTag,
} from '#/components/detail-page';
import type { EntityId } from '#/types/tb';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

import {
  getImageResource,
  removeImagePrefix,
} from '#/adapter/component/image-input/utils';
import ImagePreview from '#/adapter/component/image-preview.vue';
import {
  deleteAssetProfile,
  getAssetProfileById,
  setDefaultAssetProfile,
} from '#/api/tb/asset-profile';
import { findEntityDataByQuery } from '#/api/tb/entity-query';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';
import { exportJsonFile, prepareEntityExport } from '#/utils/import-export';

import ProfileForm from './form.vue';

defineOptions({ name: 'AssetProfileDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const profileId = computed(() => String(route.params.assetProfileId ?? ''));
const profile = ref<AssetProfile>();
const relatedNames = ref<Record<string, string>>({});
const activeTab = ref('details');
const loading = ref(false);
const imageResource = computed(() => getImageResource(profile.value?.image));

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ProfileForm,
  destroyOnClose: true,
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.TENANT_ADMIN] },
  { key: 'calculatedFields', auth: [Authority.TENANT_ADMIN] },
  { key: 'alarmRules', auth: [Authority.TENANT_ADMIN] },
  { key: 'auditLogs', auth: [Authority.TENANT_ADMIN] },
];
const basicFields = computed(() => [
  { label: $t('asset-profile.fields.name'), value: profile.value?.name },
  {
    label: $t('asset-profile.fields.default'),
    value: $t(profile.value?.default ? 'tb.common.yes' : 'tb.common.no'),
  },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(profile.value?.createdTime),
  },
  {
    label: $t('asset-profile.fields.defaultQueue'),
    value:
      profile.value?.defaultQueueName ||
      $t('asset-profile.features.form.queuePlaceholder'),
  },
  {
    label: $t('asset-profile.fields.defaultRuleChain'),
    value: entityName(
      profile.value?.defaultRuleChainId,
      $t('asset-profile.features.form.ruleChainPlaceholder'),
    ),
  },
  {
    label: $t('asset-profile.fields.defaultEdgeRuleChain'),
    value: entityName(profile.value?.defaultEdgeRuleChainId),
  },
  {
    label: $t('asset-profile.fields.defaultDashboard'),
    value: entityName(profile.value?.defaultDashboardId),
  },
]);
const headerFields = computed<DetailTag[]>(() => [
  {
    key: 'description',
    icon: 'lucide:text',
    label: $t('asset-profile.fields.description'),
    value: profile.value?.description,
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  {
    key: 'copyId',
    label: $t('asset-profile.features.detail.copyId'),
    icon: 'lucide:copy',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('asset-profile.actions.edit'),
      icon: 'lucide:square-pen',
      auth: [Authority.TENANT_ADMIN],
    },
    {
      key: 'export',
      label: $t('asset-profile.actions.export'),
      icon: 'lucide:download',
      auth: [Authority.TENANT_ADMIN],
    },
    {
      key: 'setDefault',
      label: $t('asset-profile.actions.setDefault'),
      icon: 'lucide:flag',
      auth: [Authority.TENANT_ADMIN],
      disabled: !!profile.value?.default,
    },
    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      label: $t('asset-profile.actions.delete'),
      icon: 'lucide:trash-2',
      auth: [Authority.TENANT_ADMIN],
      disabled: !!profile.value?.default,
      danger: true,
      group: 'delete',
    },
  ],
}));

function entityName(entity?: EntityId | null, empty = '—') {
  return entity?.id
    ? relatedNames.value[entity.id] ||
        $t('asset-profile.features.detail.nameUnavailable')
    : empty;
}

function handleAction(key: string) {
  const handlers: Record<string, () => unknown> = {
    copyId: () =>
      copyToClipboard(
        profileId.value,
        $t('asset-profile.features.detail.idCopied'),
      ),
    edit: handleEdit,
    export: handleExport,
    setDefault: handleSetDefault,
    refresh: loadProfile,
    delete: handleDelete,
  };
  return handlers[key]?.();
}

watch(
  profileId,
  () => {
    profile.value = undefined;
    relatedNames.value = {};
    activeTab.value = 'details';
    resetBreadcrumbTitle();
    void loadProfile();
  },
  { immediate: true },
);

async function loadProfile() {
  const id = profileId.value;
  if (!id) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const info = await getAssetProfileById(id);
    if (profileId.value !== id) return;
    const names = await Promise.all(
      [
        info.defaultRuleChainId,
        info.defaultEdgeRuleChainId,
        info.defaultDashboardId,
      ]
        .filter((entity) => entity !== null && entity !== undefined)
        .map(async (entity) => {
          const name = await findEntityDataByQuery({
            entityFilter: { type: 'singleEntity', singleEntity: entity },
            entityFields: [{ type: 'ENTITY_FIELD', key: 'name' }],
            pageLink: { page: 0, pageSize: 1 },
          })
            .then(({ data }) => data[0]?.latest.ENTITY_FIELD?.name?.value ?? '')
            .catch(() => '');
          return [entity.id, name];
        }),
    );
    if (profileId.value !== id) return;
    profile.value = info;
    relatedNames.value = Object.fromEntries(names);
    setBreadcrumbTitle(info.name);
  } catch {
    if (profileId.value === id) profile.value = undefined;
  } finally {
    if (profileId.value === id) loading.value = false;
  }
}

function handleBack() {
  return router.push({ name: 'AssetProfileList' });
}

function handleEdit() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  formModalApi.setData({ assetProfileId: profileId.value }).open();
}

async function handleExport() {
  const id = profileId.value;
  if (!id || loading.value || !hasAccessByRoles([Authority.TENANT_ADMIN]))
    return;
  loading.value = true;
  try {
    const info = await getAssetProfileById(id);
    const data = prepareEntityExport(info);
    data.default = false;
    exportJsonFile(data, info.name);
  } finally {
    if (profileId.value === id) loading.value = false;
  }
}

async function handleSetDefault() {
  const current = profile.value;
  if (
    !current?.id ||
    current.default ||
    loading.value ||
    !hasAccessByRoles([Authority.TENANT_ADMIN])
  )
    return;
  try {
    await confirm({
      title: $t('asset-profile.features.setDefault.title', {
        name: current.name,
      }),
      content: $t('asset-profile.features.setDefault.content'),
      icon: 'warning',
    });
  } catch {
    return;
  }
  if (profileId.value !== current.id.id) return;
  loading.value = true;
  try {
    await setDefaultAssetProfile(current.id.id);
    message.success($t('asset-profile.features.setDefault.success'));
    if (profileId.value === current.id.id) await loadProfile();
  } finally {
    if (profileId.value === current.id.id) loading.value = false;
  }
}

async function handleDelete() {
  const current = profile.value;
  if (
    !current?.id ||
    current.default ||
    loading.value ||
    !hasAccessByRoles([Authority.TENANT_ADMIN])
  )
    return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('asset-profile.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('asset-profile.menu'),
        name: current.name,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteAssetProfile(id);
          message.success($t('tb.common.messages.delete.success'));
          if (profileId.value === id)
            await router.replace({ name: 'AssetProfileList' });
          return true;
        } catch {
          return false;
        } finally {
          if (profileId.value === id) loading.value = false;
        }
      },
    });
  } catch {}
}
</script>

<template>
  <DetailPage
    :page-title="$t('asset-profile.features.detail.title')"
    :key="profileId"
    v-model:active-tab="activeTab"
    :title="profile?.name"
    :status="
      profile?.default
        ? {
            text: $t('asset-profile.features.detail.default'),
            variant: 'success',
          }
        : undefined
    "
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :tabs="tabs"
    :tags="headerFields"
    :entity-id="profile?.id"
    :state="loading ? 'loading' : profile ? 'ready' : 'error'"
    :error-message="$t('asset-profile.features.detail.notFound')"
    @action="handleAction"
    @retry="loadProfile"
    @back="handleBack"
  >
    <template #modals><FormModal @success="loadProfile" /></template>
    <template #tab-details>
      <Card
        v-if="profile"
        class="flex-1"
        icon="lucide:package"
        :title="$t('asset-profile.features.detail.basic')"
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
          <div v-if="profile.image" class="space-y-2 sm:col-span-2">
            <dt class="text-sm text-muted-foreground">
              {{ $t('asset-profile.fields.image') }}
            </dt>
            <dd>
              <ImagePreview
                v-if="imageResource"
                v-bind="imageResource"
                class="h-32 w-48 rounded-lg border"
              />
              <img
                v-else
                :src="removeImagePrefix(profile.image)"
                :alt="profile.name"
                class="h-32 max-w-full rounded-lg border object-contain"
              />
            </dd>
          </div>
          <div class="space-y-2 border-t pt-5 sm:col-span-2">
            <dt class="text-sm text-muted-foreground">
              {{ $t('asset-profile.fields.description') }}
            </dt>
            <dd
              class="whitespace-pre-wrap break-words text-sm leading-7"
              :class="!profile.description && 'text-muted-foreground'"
            >
              {{
                profile.description ||
                $t('asset-profile.features.detail.noDescription')
              }}
            </dd>
          </div>
        </dl>
      </Card>
    </template>
  </DetailPage>
</template>
