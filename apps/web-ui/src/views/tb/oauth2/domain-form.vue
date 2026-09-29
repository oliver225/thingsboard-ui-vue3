<script lang="ts" setup>
import type { OAuth2Client, OAuth2Domain } from '#/api/tb/oauth2';

import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Input } from '@vben-core/shadcn-ui';

import { useClipboard } from '@vueuse/core';
import { message } from 'antdv-next';

import { EntityInput } from '#/adapter/component';
import { useVbenForm, z } from '#/adapter/form';
import {
  getOAuth2Domain,
  getOAuth2LoginProcessingUrl,
  saveOAuth2Domain,
  updateDomainOAuth2Clients,
} from '#/api/tb/oauth2';
import { $t } from '#/locales';

import ClientForm from './client-form.vue';
import { getDomainClientIds } from './form-data';

interface DomainFormValues {
  _redirectUrl?: string;
  name: string;
  oauth2Enabled: boolean;
  propagateToEdge: boolean;
  clientIds: string[];
}

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<null | OAuth2Domain>(null);
const isReady = ref(false);
const clientVersion = ref(0);
const domainName = ref('');
const loginProcessingUrl = ref('');
const associationFailed = ref(false);
let originalClientIds: string[] = [];

const { copy } = useClipboard({ legacy: true });
const redirectUrl = computed(() =>
  domainName.value.trim() && loginProcessingUrl.value
    ? domainName.value.trim() + loginProcessingUrl.value
    : '',
);

const [ClientModal, clientModalApi] = useVbenModal({
  connectedComponent: ClientForm,
  destroyOnClose: true,
});

function handleCreate() {
  clientModalApi.setData({}).open();
}

async function onSuccess(client: OAuth2Client) {
  if (!client.id) return;
  const clientId = client.id.id;
  clientVersion.value++;
  const formValues = await formApi.getValues();
  await formApi.setFieldValue('clientIds', [
    ...new Set([...formValues.clientIds, clientId]),
  ]);
}

async function handleCopyRedirectUrl() {
  if (!redirectUrl.value) return;
  try {
    await copy(redirectUrl.value);
    message.success($t('oauth2.features.form.copied'));
  } catch {
    message.error($t('oauth2.features.form.copyFailed'));
  }
}

const [Form, formApi] = useVbenForm<DomainFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5',
  showDefaultActions: false,
  handleValuesChange(formValues) {
    domainName.value = formValues.name ?? '';
  },
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        placeholder: 'example.com:8080',
        autocomplete: 'off',
      },
      defaultValue: '',
      description: $t('oauth2.features.form.domainNameHint'),
      fieldName: 'name',
      label: $t('oauth2.fields.domainName'),
      rules: z
        .string({ error: $t('oauth2.validation.domainRequired') })
        .trim()
        .min(1, { message: $t('oauth2.validation.domainRequired') })
        .max(255, { message: $t('oauth2.validation.maxLength', { max: 255 }) })
        .regex(/^[^\s/:?#@]+(?::\d{1,5})?$/, {
          message: $t('oauth2.validation.invalidDomain'),
        }),
    },
    {
      component: 'VbenInput',
      componentProps: { readonly: true },
      description: $t('oauth2.features.form.redirectHint'),
      fieldName: '_redirectUrl',
      label: $t('oauth2.fields.redirectUrl'),
    },
    {
      component: 'TbSwitch',
      componentProps: { title: $t('oauth2.fields.enabled') },
      defaultValue: true,
      fieldName: 'oauth2Enabled',
      hideLabel: true,
    },
    {
      component: 'EntityInput',
      componentProps: () => ({
        entityType: isReady.value ? 'OAUTH2_CLIENT' : undefined,
        key: `${isReady.value}:${clientVersion.value}`,
        multiple: true,
        showSearch: true,
        params: { sortProperty: 'title', sortOrder: 'ASC' },
        placeholder: $t('oauth2.features.form.selectClients'),
      }),
      defaultValue: [],
      fieldName: 'clientIds',
      label: $t('oauth2.fields.clients'),
    },
    {
      component: 'TbSwitch',
      componentProps: { title: $t('oauth2.fields.propagateToEdge') },
      defaultValue: false,
      fieldName: 'propagateToEdge',
      hideLabel: true,
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ domainId?: string }>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();
    const domain: OAuth2Domain = {
      ...record.value,
      name: formValues.name.trim(),
      oauth2Enabled: formValues.oauth2Enabled,
      propagateToEdge: formValues.propagateToEdge,
    };

    modalApi.lock();
    associationFailed.value = false;
    try {
      const isUpdate = !!record.value?.id;
      const savedDomain = await saveOAuth2Domain(
        domain,
        isUpdate ? undefined : formValues.clientIds,
      );
      // 保留最新 ID 和版本，关联失败时可重试，不会重复创建域名。
      record.value = savedDomain;
      if (
        isUpdate &&
        savedDomain.id &&
        JSON.stringify(originalClientIds.toSorted()) !==
          JSON.stringify(formValues.clientIds.toSorted())
      ) {
        try {
          await updateDomainOAuth2Clients(savedDomain.id.id, [
            ...formValues.clientIds,
          ]);
        } catch {
          associationFailed.value = true;
          return;
        }
      }
      originalClientIds = [...formValues.clientIds];
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { domainId } = modalApi.getData() ?? {};
    isReady.value = false;
    record.value = null;
    associationFailed.value = false;
    originalClientIds = [];
    loginProcessingUrl.value = '';
    domainName.value = window.location.hostname;
    await formApi.reset({
      values: {
        name: domainName.value,
        oauth2Enabled: true,
        propagateToEdge: false,
        clientIds: [],
      },
    });
    modalApi.setState({
      title: domainId
        ? $t('oauth2.actions.editDomain')
        : $t('oauth2.actions.addDomain'),
    });

    modalApi.lock();
    try {
      const [path, domain] = await Promise.all([
        getOAuth2LoginProcessingUrl(),
        domainId ? getOAuth2Domain(domainId) : Promise.resolve(null),
      ]);

      loginProcessingUrl.value = path;
      if (domain) {
        const { oauth2ClientInfos: _clientInfos, ...savedDomain } = domain;
        record.value = savedDomain;
        originalClientIds = getDomainClientIds(domain);
        domainName.value = domain.name;
        await formApi.setValues({
          name: domain.name,
          oauth2Enabled: domain.oauth2Enabled,
          propagateToEdge: domain.propagateToEdge,
          clientIds: [...originalClientIds],
        });
      }
      isReady.value = true;
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
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
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
    <ClientModal @success="onSuccess" />
    <Form>
      <template #_redirectUrl="slotProps">
        <div class="flex w-full min-w-0 gap-2">
          <Input
            v-bind="{
              ...slotProps.componentProps,
              'onUpdate:modelValue': undefined,
            }"
            :model-value="redirectUrl"
            class="min-w-0 flex-1 bg-muted/50"
            readonly
          />
          <VbenButton
            type="button"
            variant="outline"
            class="h-10 shrink-0"
            :disabled="!redirectUrl"
            @click="handleCopyRedirectUrl"
          >
            <IconifyIcon
              icon="lucide:copy"
              class="mr-2 size-4"
              aria-hidden="true"
            />
            {{ $t('oauth2.actions.copy') }}
          </VbenButton>
        </div>
      </template>
      <template #clientIds="slotProps">
        <div class="w-full space-y-2">
          <EntityInput v-bind="slotProps.componentProps" />
          <VbenButton
            type="button"
            variant="link"
            class="h-7 gap-1 px-0 text-sm"
            @click="handleCreate"
          >
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
            {{ $t('oauth2.actions.addClient') }}
          </VbenButton>
        </div>
      </template>
    </Form>
    <div
      v-if="associationFailed"
      role="alert"
      class="text-destructive border-destructive/30 bg-destructive/5 mb-5 flex gap-3 rounded-md border p-3 text-sm"
    >
      <IconifyIcon
        icon="lucide:circle-alert"
        class="mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
      <p>{{ $t('oauth2.features.form.associationFailed') }}</p>
    </div>
  </Modal>
</template>
