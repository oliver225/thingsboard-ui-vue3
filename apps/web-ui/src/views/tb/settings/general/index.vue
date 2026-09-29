<script setup lang="ts">
import type { AdminSettings, GeneralSettings } from '#/api/tb/admin';

import { onMounted, reactive } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Input, message } from 'antdv-next';

import TbSwitch from '#/adapter/component/tb-switch.vue';
import { getAdminSettings, saveAdminSettings } from '#/api/tb/admin';
import { FormSection } from '#/components/form-section';
import { useFormRequest } from '#/hooks/use-form-request';

import SettingsPanel from '../components/settings-panel.vue';

const { isLoading, isSaving, isReady, read, write } = useFormRequest();

/** 常规设置(整个 AdminSettings) */
const formValues = reactive<AdminSettings<GeneralSettings>>({
  jsonValue: { baseUrl: '', prohibitDifferentUrl: false },
  key: 'general',
});

async function performLoad() {
  Object.assign(formValues, await getAdminSettings<GeneralSettings>('general'));
}

async function performSave() {
  if (
    !/^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(
      formValues.jsonValue.baseUrl.trim(),
    )
  ) {
    message.error($t('settings.features.general.baseUrlRequired'));
    return;
  }
  Object.assign(formValues, await saveAdminSettings(formValues));
  message.success($t('tb.common.saveSuccess'));
}

const handleReload = () => read(performLoad);
const handleSave = () => write(performSave);
onMounted(handleReload);
</script>
<template>
  <SettingsPanel :title="$t('settings.features.general.title')">
    <FormSection>
      <div class="flex flex-col gap-6">
        <div>
          <label
            for="settings-base-url"
            class="mb-2 block text-sm font-medium leading-5"
          >
            <span class="text-destructive">*</span>
            {{ $t('settings.features.general.baseUrl') }}
          </label>
          <Input
            id="settings-base-url"
            class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
            :disabled="!isReady || isSaving"
            v-model:value="formValues.jsonValue.baseUrl"
            :placeholder="$t('settings.features.general.baseUrlPlaceholder')"
          />
        </div>
        <TbSwitch
          v-model:checked="formValues.jsonValue.prohibitDifferentUrl"
          :title="$t('settings.features.general.prohibitDifferentUrl')"
          :description="
            $t('settings.features.general.prohibitDifferentUrlHint')
          "
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
