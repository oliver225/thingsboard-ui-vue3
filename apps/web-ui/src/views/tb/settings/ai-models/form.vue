<script lang="ts" setup>
import type { AiModelConnectionValues, AiModelFormValues } from './form-data';

import type { AiModel } from '#/api/tb/ai-model';

import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getAiModelById, saveAiModel } from '#/api/tb/ai-model';
import { FormSection } from '#/components/form-section';
import { AiProvider } from '#/enums';
import { $t } from '#/locales';

import { modelFields } from './config';
import ConnectivityTest from './connectivity-test.vue';
import {
  isServiceAccountKeyValid,
  toAiModelPayload,
  toConnectionFormValues,
} from './form-data';
import {
  createConnectionSchema,
  createGeneralSchema,
  createParametersSchema,
} from './form-schema';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<AiModel | null>(null);
const provider = ref(AiProvider.OPENAI);
const isChangingProvider = ref(false);
const parametersOpen = ref(false);
const serviceAccountInputRef = ref<HTMLInputElement>();
const serviceAccountFileName = ref('');

const formOptions = {
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-0',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2',
  showDefaultActions: false,
} as const;
const [GeneralForm, generalFormApi] = useVbenForm<AiModelFormValues>({
  ...formOptions,
  schema: createGeneralSchema(provider.value),
  async handleValuesChange(formValues) {
    if (
      modalState.value.submitting ||
      !formValues.provider ||
      provider.value === formValues.provider
    )
      return;
    await handleProviderChange(formValues.provider);
  },
});
const [ConnectionForm, connectionFormApi] =
  useVbenForm<AiModelConnectionValues>({
    ...formOptions,
    schema: createConnectionSchema(provider.value),
  });
const [ParametersForm, parametersFormApi] = useVbenForm<AiModelFormValues>({
  ...formOptions,
  schema: createParametersSchema(provider.value),
});
const formApis = [generalFormApi, connectionFormApi, parametersFormApi];

// schema 的文案随语言更新，字段值由各自的 formApi 保留。
const schemas = computed(() => ({
  general: createGeneralSchema(provider.value),
  connection: createConnectionSchema(provider.value),
  parameters: createParametersSchema(provider.value),
}));
watch(
  schemas,
  (value) => {
    generalFormApi.setState({ schema: value.general });
    connectionFormApi.setState({ schema: value.connection });
    parametersFormApi.setState({ schema: value.parameters });
  },
  { flush: 'sync' },
);

const [Modal, modalApi] = useVbenModal<{ aiModelId?: string }>({
  async onConfirm() {
    if (isBusy.value) return;
    modalApi.lock();
    try {
      if (!(await isFormValid())) return;
      await saveAiModel(await toFormPayload());
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { aiModelId } = modalApi.getData() ?? {};
    record.value = null;
    serviceAccountFileName.value = '';
    parametersOpen.value = false;
    modalApi.setState({
      title: aiModelId
        ? $t('settings.features.ai.actions.edit')
        : $t('settings.features.ai.actions.create'),
    });
    modalApi.lock();
    try {
      if (aiModelId) record.value = await getAiModelById(aiModelId);
      const configuration = record.value?.configuration;
      provider.value = configuration?.provider ?? AiProvider.OPENAI;
      await nextTick();
      for (const api of formApis) await api.reset();
      await generalFormApi.setValues({
        name: record.value?.name ?? '',
        provider: provider.value,
        modelId: configuration?.modelId ?? '',
      });
      await connectionFormApi.setValues(
        toConnectionFormValues(provider.value, configuration?.providerConfig),
      );
      await parametersFormApi.setValues(
        Object.fromEntries(
          modelFields[provider.value].map((field) => [
            field,
            configuration?.[field] ?? null,
          ]),
        ),
      );
      serviceAccountFileName.value =
        configuration?.providerConfig?.fileName ?? '';
      parametersOpen.value = modelFields[provider.value].some(
        (field) =>
          configuration?.[field] !== null &&
          configuration?.[field] !== undefined,
      );
      await nextTick();
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
const isBusy = computed(
  () => modalState.value.submitting || isChangingProvider.value,
);
const [ConnectivityModal, connectivityModalApi] = useVbenModal({
  connectedComponent: ConnectivityTest,
  destroyOnClose: true,
});

watch(
  isBusy,
  (disabled) => {
    for (const api of formApis) api.setState({ commonConfig: { disabled } });
    modalApi.setState({ confirmDisabled: disabled });
  },
  { immediate: true },
);

async function handleProviderChange(aiProvider: AiProvider) {
  isChangingProvider.value = true;
  try {
    provider.value = aiProvider;
    serviceAccountFileName.value = '';
    await nextTick();
    await connectionFormApi.reset();
    await parametersFormApi.reset();
    await connectionFormApi.setValues(toConnectionFormValues(aiProvider));
    await generalFormApi.setValues({ modelId: '' });
    await generalFormApi.clearValidation();
  } finally {
    isChangingProvider.value = false;
  }
}

async function isFormValid() {
  const general = await generalFormApi.validate();
  const connection = await connectionFormApi.validate();
  const parameters = await parametersFormApi.validate();
  if (!parameters.valid) parametersOpen.value = true;
  return general.valid && connection.valid && parameters.valid;
}

async function toFormPayload() {
  const formValues = {
    ...(await generalFormApi.getValues()),
    ...(await parametersFormApi.getValues()),
  };
  const connection = await connectionFormApi.getValues();
  return toAiModelPayload(
    formValues,
    { ...connection, fileName: serviceAccountFileName.value },
    record.value,
  );
}

async function handleTestConnectivity() {
  if (isBusy.value || !(await isFormValid())) return;
  connectivityModalApi.setData({ aiModel: await toFormPayload() }).open();
}

async function handleImportServiceAccount(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || isBusy.value) return;
  try {
    const serviceAccountKey = await file.text();
    if (!isServiceAccountKeyValid(serviceAccountKey)) {
      message.error($t('settings.features.ai.validation.serviceAccount'));
      return;
    }
    // 读取文件期间可能已经切换供应商。
    if (provider.value !== AiProvider.GOOGLE_VERTEX_AI_GEMINI) return;
    await connectionFormApi.setValues({ serviceAccountKey });
    serviceAccountFileName.value = file.name;
    await connectionFormApi.validate();
  } catch {
    message.error($t('settings.features.ai.validation.fileRead'));
  }
}
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          v-if="typeof route.meta.icon === 'string'"
          :icon="route.meta.icon"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ modalState.title }}
      </span>
    </template>
    <div class="flex min-w-0 flex-col gap-5">
      <FormSection
        :title="$t('settings.features.ai.groups.general')"
        size="small"
        :description="$t('settings.features.ai.form.generalDescription')"
      >
        <GeneralForm class="form-message-flow" />
      </FormSection>
      <FormSection
        :title="$t('settings.features.ai.groups.connection')"
        size="small"
        :description="$t('settings.features.ai.form.connectionDescription')"
      >
        <ConnectionForm class="form-message-flow" />
        <div
          v-if="provider === AiProvider.GOOGLE_VERTEX_AI_GEMINI"
          class="mt-4 flex flex-wrap items-center gap-3"
        >
          <input
            ref="serviceAccountInputRef"
            type="file"
            accept=".json,application/json"
            class="hidden"
            :aria-label="
              $t('settings.features.ai.actions.importServiceAccount')
            "
            @change="handleImportServiceAccount"
          />
          <VbenButton
            type="button"
            variant="outline"
            size="sm"
            :disabled="isBusy"
            @click="serviceAccountInputRef?.click()"
          >
            <IconifyIcon
              icon="lucide:upload"
              class="mr-2 size-4"
              aria-hidden="true"
            />
            {{ $t('settings.features.ai.actions.importServiceAccount') }}
          </VbenButton>
          <p
            v-if="serviceAccountFileName"
            class="text-muted-foreground m-0 min-w-0 break-all text-xs"
          >
            {{ serviceAccountFileName }}
          </p>
        </div>
      </FormSection>
      <FormSection
        v-model:open="parametersOpen"
        collapsible
        size="small"
        :title="$t('settings.features.ai.parameters')"
        :description="$t('settings.features.ai.form.parametersDescription')"
      >
        <ParametersForm class="form-message-flow" />
      </FormSection>
    </div>
    <template #prepend-footer>
      <VbenButton
        type="button"
        variant="outline"
        :disabled="isBusy"
        @click="handleTestConnectivity"
      >
        <IconifyIcon
          icon="lucide:plug-zap"
          class="mr-2 size-4"
          aria-hidden="true"
        />
        {{ $t('settings.features.ai.test') }}
      </VbenButton>
    </template>
    <ConnectivityModal />
  </Modal>
</template>
