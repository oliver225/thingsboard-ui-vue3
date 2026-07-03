<script lang="ts" setup>
/**
 * 首页设置(TENANT_ADMIN):为本租户设置默认首页仪表板 + 是否隐藏工具栏。
 * 契约:GET/POST /api/tenant/dashboard/home/info(DashboardController)。
 */
import { onMounted, reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message, Select, Switch } from 'antdv-next';

import {
  getTenantDashboards,
  getTenantHomeDashboardInfo,
  setTenantHomeDashboardInfo,
} from '#/api/tb/dashboard';
import { EntityType } from '#/enums';

defineOptions({ name: 'SettingsHome' });

const loading = ref(false);
const saving = ref(false);
const dashboardOptions = ref<Array<{ label: string; value: string }>>([]);

const form = reactive({
  dashboardId: undefined as string | undefined,
  hideToolbar: false,
});

async function loadDashboards() {
  const pageData = await getTenantDashboards({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'title',
  });
  dashboardOptions.value = pageData.data.map((item) => ({
    label: item.title,
    value: item.id.id,
  }));
}

async function load() {
  loading.value = true;
  try {
    await loadDashboards();
    const info = await getTenantHomeDashboardInfo();
    form.dashboardId = info?.dashboardId?.id;
    form.hideToolbar = info?.hideDashboardToolbar ?? false;
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  saving.value = true;
  try {
    await setTenantHomeDashboardInfo({
      dashboardId: form.dashboardId
        ? { entityType: EntityType.DASHBOARD, id: form.dashboardId }
        : null,
      hideDashboardToolbar: form.hideToolbar,
    });
    message.success($t('tb.common.saveSuccess'));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="bg-card rounded-lg border p-6">
    <h3 class="text-foreground text-lg font-bold">
      {{ $t('tb.settings.homeSettings.title') }}
    </h3>
    <p class="text-muted-foreground mt-1 text-sm">
      {{ $t('tb.settings.homeSettings.hint') }}
    </p>

    <div class="mt-6 space-y-5">
      <div>
        <div class="mb-1.5 text-sm font-medium">
          {{ $t('tb.settings.homeSettings.homeDashboard') }}
        </div>
        <Select
          v-model:value="form.dashboardId"
          allow-clear
          show-search
          size="large"
          :loading="loading"
          :options="dashboardOptions"
          option-filter-prop="label"
          :placeholder="$t('tb.settings.homeSettings.homeDashboardPlaceholder')"
          style="width: 100%"
        />
      </div>

      <div class="flex items-center gap-3">
        <Switch v-model:checked="form.hideToolbar" />
        <span class="text-sm">
          {{ $t('tb.settings.homeSettings.hideToolbar') }}
        </span>
      </div>
    </div>

    <VbenButton class="mt-6" :loading="saving" @click="onSave">
      {{ $t('tb.common.save') }}
    </VbenButton>
  </div>
</template>
