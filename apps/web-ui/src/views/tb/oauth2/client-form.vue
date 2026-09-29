<script lang="ts" setup>
import type {
  ClientFormValues,
  ClientGeneralFormValues,
  ClientMapperFormValues,
} from './form-data';

import type { OAuth2Client, OAuth2Template } from '#/api/tb/oauth2';

import { computed, nextTick, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Alert, message, Segmented } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  getOAuth2Client,
  getOAuth2Templates,
  saveOAuth2Client,
} from '#/api/tb/oauth2';
import { FormSection } from '#/components/form-section';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import {
  applyClientTemplate,
  createDefaultClient,
  toClientFormValues,
  toClientPayload,
} from './form-data';
import {
  createClientFormSchema,
  createGeneralFormSchema,
  createMapperFormSchema,
} from './form-schema';

const emit = defineEmits<{ success: [client: OAuth2Client] }>();

const route = useRoute();
const { hasAccessByRoles } = useAccess();
const record = ref<null | OAuth2Client>(null);
const templates = ref<OAuth2Template[]>([]);
const providerName = ref('Custom');
const advancedOpen = ref(false);
const advancedTab = ref('general');
const advancedTabs = computed(() => [
  { value: 'general', label: $t('oauth2.sections.groups.general') },
  { value: 'mapper', label: $t('oauth2.sections.groups.mapper') },
]);

const providerOptions = computed(() =>
  [
    ...new Set([
      'Custom',
      ...templates.value.map((template) => template.name),
      providerName.value,
    ]),
  ]
    .filter(Boolean)
    .map((value) => ({
      value,
      label: value === 'Custom' ? $t('oauth2.options.customProvider') : value,
    })),
);
const platformOptions = computed(() => {
  const options = [
    { value: 'ANDROID', label: $t('oauth2.options.platform.ANDROID') },
    { value: 'IOS', label: $t('oauth2.options.platform.IOS') },
  ];
  if (hasAccessByRoles([Authority.SYS_ADMIN])) {
    options.unshift({ value: 'WEB', label: $t('oauth2.options.platform.WEB') });
  }
  return options;
});

async function getClientValues(
  basicValues?: ClientFormValues,
): Promise<OAuth2Client> {
  const [basic, general, mapper] = await Promise.all([
    basicValues ?? formApi.getValues(),
    generalFormApi.getValues(),
    mapperFormApi.getValues(),
  ]);
  const { allowUserCreation, activateUser, ...settings } = general;
  return {
    ...record.value,
    ...basic,
    ...settings,
    ...mapper,
    mapperConfig: { ...mapper.mapperConfig, allowUserCreation, activateUser },
  };
}

async function resetClientForms(client: OAuth2Client) {
  providerName.value = client.additionalInfo.providerName;
  const formValues = toClientFormValues(client);
  await Promise.all([
    formApi.reset({ values: formValues.basic }),
    generalFormApi.reset({ values: formValues.general }),
    mapperFormApi.reset({ values: formValues.mapper }),
  ]);
}

async function handleProviderChange(formValues: ClientFormValues) {
  const selectedProvider = formValues.additionalInfo?.providerName;
  if (!selectedProvider || selectedProvider === providerName.value) return;
  providerName.value = selectedProvider;
  const client = applyClientTemplate(
    await getClientValues(formValues),
    templates.value.find((template) => template.name === selectedProvider),
  );
  await resetClientForms(client);
  if (providerName.value === 'Custom') advancedOpen.value = true;
}

const commonFormConfig = {
  layout: 'vertical' as const,
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
};

const [Form, formApi] = useVbenForm<ClientFormValues>({
  ...commonFormConfig,
  handleValuesChange: handleProviderChange,
  schema: createClientFormSchema(
    () => providerOptions.value,
    () => platformOptions.value,
  ),
});
const [GeneralForm, generalFormApi] = useVbenForm<ClientGeneralFormValues>({
  ...commonFormConfig,
  schema: createGeneralFormSchema(),
});
const [MapperForm, mapperFormApi] = useVbenForm<ClientMapperFormValues>({
  ...commonFormConfig,
  schema: createMapperFormSchema(),
});

const [Modal, modalApi] = useVbenModal<{ clientId?: string }>({
  async onConfirm() {
    const [basic, general, mapper] = await Promise.all([
      formApi.validate(),
      generalFormApi.validate(),
      mapperFormApi.validate(),
    ]);
    if (!basic.valid) {
      formApi.scrollToFirstError(basic.errors);
      return;
    }
    if (!general.valid || !mapper.valid) {
      advancedOpen.value = true;
      advancedTab.value = general.valid ? 'mapper' : 'general';
      await nextTick();
      if (general.valid) {
        mapperFormApi.scrollToFirstError(mapper.errors);
      } else {
        generalFormApi.scrollToFirstError(general.errors);
      }
      return;
    }
    const client = toClientPayload(await getClientValues());

    modalApi.lock();
    try {
      const savedClient = await saveOAuth2Client(client);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success', savedClient);
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { clientId } = modalApi.getData() ?? {};
    record.value = null;
    templates.value = [];
    providerName.value = 'Custom';
    advancedOpen.value = false;
    advancedTab.value = 'general';
    await resetClientForms(createDefaultClient());
    modalApi.setState({
      title: clientId
        ? $t('oauth2.actions.editClient')
        : $t('oauth2.actions.addClient'),
    });

    modalApi.lock();
    try {
      const [templateData, client] = await Promise.all([
        getOAuth2Templates(),
        clientId ? getOAuth2Client(clientId) : Promise.resolve(null),
      ]);
      templates.value = templateData;
      const defaults = createDefaultClient();
      let formValues: OAuth2Client;
      if (client) {
        record.value = client;
        formValues = {
          ...defaults,
          ...client,
          additionalInfo: {
            ...defaults.additionalInfo,
            ...client.additionalInfo,
          },
          mapperConfig: {
            ...defaults.mapperConfig,
            ...client.mapperConfig,
            basic: {
              ...defaults.mapperConfig.basic,
              ...client.mapperConfig.basic,
            },
            custom: {
              ...defaults.mapperConfig.custom,
              ...client.mapperConfig.custom,
              sendToken: client.mapperConfig.custom?.sendToken ?? false,
            },
          },
        };
      } else {
        formValues = applyClientTemplate(
          defaults,
          templateData.find((template) => template.name === 'Google'),
        );
      }
      await resetClientForms(formValues);
      advancedOpen.value = providerName.value === 'Custom';
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
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
    <Form />
    <FormSection
      v-model:open="advancedOpen"
      :title="$t('oauth2.sections.groups.advancedSettings')"
      collapsible
      class="oauth2-advanced-settings mb-5"
    >
      <template #actions>
        <Segmented
          v-model:value="advancedTab"
          :options="advancedTabs"
          :aria-label="$t('oauth2.sections.groups.advancedSettings')"
          shape="round"
          size="medium"
          class="oauth2-advanced-tabs"
          @change="advancedOpen = true"
        />
      </template>
      <GeneralForm v-show="advancedTab === 'general'" />
      <MapperForm v-show="advancedTab === 'mapper'" />
    </FormSection>
    <Alert
      class="mb-5 rounded-md"
      type="warning"
      show-icon
      :title="$t('oauth2.features.form.domainHint')"
      :classes="{ title: 'text-sm leading-6' }"
    />
  </Modal>
</template>

<style scoped>
.oauth2-advanced-settings :deep(.form-section-header) {
  gap: 12px;
  align-items: center;
}

.oauth2-advanced-tabs {
  background: hsl(var(--muted));
}

.oauth2-advanced-tabs :deep(.ant-segmented-item-label) {
  min-width: 56px;
  padding-inline: 12px;
  font-size: 12px;
}

.oauth2-advanced-tabs :deep(.ant-segmented-item-selected),
.oauth2-advanced-tabs :deep(.ant-segmented-thumb) {
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
  box-shadow: none;
}
</style>
