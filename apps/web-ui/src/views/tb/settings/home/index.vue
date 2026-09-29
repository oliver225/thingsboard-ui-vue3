<script setup lang="ts">
/**
 * 首页设置(TENANT_ADMIN):为本租户设置默认首页仪表板 + 是否隐藏工具栏。
 * 契约:GET/POST /api/tenant/dashboard/home/info(DashboardController)。
 */
import { onMounted, reactive } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'antdv-next';

import { EntityInput } from '#/adapter/component';
import TbSwitch from '#/adapter/component/tb-switch.vue';
import {
  getTenantHomeDashboardInfo,
  setTenantHomeDashboardInfo,
} from '#/api/tb/dashboard';
import { FormSection } from '#/components/form-section';
import { EntityType } from '#/enums';
import { useFormRequest } from '#/hooks/use-form-request';

import SettingsPanel from '../components/settings-panel.vue';

defineOptions({ name: 'SettingsHome' });

const { isLoading, isSaving, isReady, read, write } = useFormRequest();

const formValues = reactive({
  dashboardId: undefined as string | undefined,
  hideToolbar: false,
});

const handleReload = () =>
  read(async () => {
    const info = await getTenantHomeDashboardInfo();
    formValues.dashboardId = info?.dashboardId?.id;
    formValues.hideToolbar = info?.hideDashboardToolbar ?? false;
  });

const handleSave = () =>
  write(async () => {
    await setTenantHomeDashboardInfo({
      dashboardId: formValues.dashboardId
        ? { entityType: EntityType.DASHBOARD, id: formValues.dashboardId }
        : null,
      hideDashboardToolbar: formValues.hideToolbar,
    });
    message.success($t('tb.common.saveSuccess'));
  });

onMounted(handleReload);
</script>

<template>
  <SettingsPanel
    :title="$t('settings.features.home.title')"
    :description="$t('settings.features.home.hint')"
  >
    <FormSection>
      <div class="flex flex-col gap-6">
        <div>
          <label
            for="home-dashboard"
            class="mb-2 block text-sm font-medium leading-5"
          >
            {{ $t('settings.features.home.homeDashboard') }}
          </label>
          <EntityInput
            id="home-dashboard"
            :disabled="!isReady || isSaving"
            v-model="formValues.dashboardId"
            show-search
            entity-type="DASHBOARD"
            :params="{ sortProperty: 'title', sortOrder: 'ASC' }"
            :placeholder="$t('settings.features.home.homeDashboardPlaceholder')"
            class="!min-h-10 w-full !rounded-md !border-input !shadow-xs"
          />
        </div>

        <TbSwitch
          :title="$t('settings.features.home.hideToolbar')"
          id="hide-home-toolbar"
          v-model:checked="formValues.hideToolbar"
          :disabled="!isReady || isSaving"
        />
      </div>
    </FormSection>
    <template #footer>
      <VbenButton
        variant="outline"
        class="min-w-20"
        :loading="isLoading"
        :disabled="isSaving"
        @click="handleReload"
      >
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton
        variant="default"
        class="min-w-20"
        :loading="isSaving"
        :disabled="!isReady || isLoading"
        @click="handleSave"
      >
        {{ $t('tb.common.save') }}
      </VbenButton>
    </template>
  </SettingsPanel>
</template>
