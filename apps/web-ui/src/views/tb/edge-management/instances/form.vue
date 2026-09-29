<script lang="ts" setup>
import type { Edge } from '#/api/tb/edge';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  useVbenModal,
  VbenButton,
  VbenInputPassword,
  VbenTooltip,
} from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Input as VbenInput } from '@vben-core/shadcn-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getEdgeById, getEdgeTypes, saveEdge } from '#/api/tb/edge';
import { $t } from '#/locales';
import { copyToClipboard, randomSecret } from '#/utils/common';

interface EdgeFormValues {
  description: string;
  label: string;
  name: string;
  type: string;
}

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<Edge | null>(null);
const credentials = ref({ routingKey: '', secret: '' });

const [Form, formApi] = useVbenForm<EdgeFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t(
          'edge-management.features.instances.form.namePlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('edge-management.features.instances.fields.name'),
      rules: z
        .string()
        .trim()
        .min(
          1,
          $t('edge-management.features.instances.validation.nameRequired'),
        )
        .max(
          255,
          $t('edge-management.features.instances.validation.maxLength'),
        ),
    },
    {
      component: 'AutoComplete',
      componentProps: {
        placeholder: $t(
          'edge-management.features.instances.form.typePlaceholder',
        ),
        filterOption: (input, option) =>
          String(option?.value ?? '')
            .toLowerCase()
            .includes(input.toLowerCase()),
      },
      defaultValue: 'default',
      fieldName: 'type',
      label: $t('edge-management.features.instances.fields.type'),
      rules: z
        .string()
        .trim()
        .min(
          1,
          $t('edge-management.features.instances.validation.typeRequired'),
        )
        .max(
          255,
          $t('edge-management.features.instances.validation.maxLength'),
        ),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t(
          'edge-management.features.instances.form.labelPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'label',
      label: $t('edge-management.features.instances.fields.label'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .max(255, $t('edge-management.features.instances.validation.maxLength'))
        .optional(),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t(
          'edge-management.features.instances.form.descriptionPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('edge-management.features.instances.fields.description'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ edgeId?: string }>({
  async onConfirm() {
    if (modalState.value.loading || modalState.value.submitting) return;
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();

    const edge: Edge = {
      ...record.value,
      additionalInfo: {
        ...record.value?.additionalInfo,
        description: formValues.description,
      },
      name: formValues.name.trim(),
      type: formValues.type.trim(),
      label: formValues.label,
      routingKey: credentials.value.routingKey,
      secret: credentials.value.secret,
    };

    modalApi.lock();
    try {
      await saveEdge(edge);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { edgeId } = modalApi.getData() ?? {};
    record.value = null;
    credentials.value = { routingKey: '', secret: '' };
    await formApi.reset();
    modalApi.setState({
      title: edgeId
        ? $t('edge-management.features.instances.actions.edit')
        : $t('edge-management.features.instances.actions.create'),
    });
    modalApi.lock();
    try {
      const [edge, types] = await Promise.all([
        edgeId ? getEdgeById(edgeId) : Promise.resolve(null),
        getEdgeTypes(),
      ]);
      formApi.updateSchema([
        {
          fieldName: 'type',
          componentProps: {
            options: types.map(({ type }) => ({ value: type })),
          },
        },
      ]);
      record.value = edge;
      // 与 ui-ngx 一致：只在新建时生成，编辑时完整保留连接凭据。
      credentials.value = edge
        ? { routingKey: edge.routingKey, secret: edge.secret }
        : { routingKey: crypto.randomUUID(), secret: randomSecret(20) };
      if (edge) {
        await formApi.setValues({
          name: edge.name,
          type: edge.type,
          label: edge.label ?? '',
          description: edge.additionalInfo?.description ?? '',
        });
      }
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
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('edge-management.features.instances.form.section') }}
      </h3>
      <p class="text-muted-foreground text-sm leading-6">
        {{ $t('edge-management.features.instances.form.hint') }}
      </p>
    </div>
    <Form />
    <section
      class="bg-muted/40 space-y-4 rounded-lg border p-4"
      aria-labelledby="edge-credentials-title"
    >
      <div class="flex gap-3">
        <IconifyIcon
          icon="lucide:key-round"
          class="text-muted-foreground mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <div class="space-y-1">
          <h3 id="edge-credentials-title" class="text-sm font-medium">
            {{ $t('edge-management.features.instances.form.credentials') }}
          </h3>
          <p class="text-muted-foreground text-sm leading-6">
            {{ $t('edge-management.features.instances.form.credentialsHint') }}
          </p>
        </div>
      </div>
      <div
        v-for="field in ['routingKey', 'secret'] as const"
        :key="field"
        class="space-y-2"
      >
        <label :for="`edge-${field}`" class="text-sm font-medium">{{
          $t(`edge-management.features.instances.fields.${field}`)
        }}</label>
        <div class="flex items-center gap-2">
          <component
            :is="field === 'secret' ? VbenInputPassword : VbenInput"
            :id="`edge-${field}`"
            :model-value="credentials[field]"
            readonly
            autocomplete="off"
            class="bg-background min-w-0 flex-1 font-mono text-sm"
          />
          <VbenTooltip>
            <template #trigger>
              <VbenButton
                type="button"
                variant="outline"
                size="icon"
                class="shrink-0"
                :disabled="!credentials[field] || modalState.loading"
                :aria-label="
                  $t(
                    `edge-management.features.instances.actions.copy${field === 'secret' ? 'Secret' : 'RoutingKey'}`,
                  )
                "
                @click="
                  copyToClipboard(
                    credentials[field],
                    $t('edge-management.messages.copied'),
                  )
                "
              >
                <IconifyIcon
                  icon="lucide:copy"
                  class="size-4"
                  aria-hidden="true"
                />
              </VbenButton>
            </template>
            {{
              $t(
                `edge-management.features.instances.actions.copy${field === 'secret' ? 'Secret' : 'RoutingKey'}`,
              )
            }}
          </VbenTooltip>
        </div>
      </div>
    </section>
  </Modal>
</template>
