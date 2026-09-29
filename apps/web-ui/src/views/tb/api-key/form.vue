<script lang="ts" setup>
import type { ApiKeyInfo } from '#/api/tb/api-key';

import { h, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';

import { Alert, message } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenForm, z } from '#/adapter/form';
import { saveApiKey, updateApiKeyDescription } from '#/api/tb/api-key';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

import TokenContent from './token-content.vue';

const emit = defineEmits<{ success: [] }>();

const record = ref<ApiKeyInfo | null>(null);

const [Form, formApi] = useVbenForm<{
  description: string;
  enabled: boolean;
  expirationPreset: 'custom' | number;
  expirationTime?: string;
}>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-0',
  },
  wrapperClass: 'grid-cols-1 gap-y-5',
  schema: [
    {
      component: 'Textarea',
      componentProps: { maxlength: 255, rows: 3, showCount: true },
      fieldName: 'description',
      label: $t('api-key.fields.description'),
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('api-key.messages.descriptionTip') }),
    },
    {
      component: 'TbSwitch',
      componentProps: () => ({ title: $t('api-key.fields.enableLabel') }),
      defaultValue: true,
      dependencies: {
        if: () => !record.value?.id?.id,
        triggerFields: ['description'],
      },
      fieldName: 'enabled',
      hideLabel: true,
    },
    {
      component: 'Select',
      componentProps: () => ({
        allowClear: false,
        options: [
          { label: $t('api-key.options.never'), value: 0 },
          ...[7, 30, 60, 90].map((days) => ({
            label: `${days} ${$t('api-key.options.days')}`,
            value: days,
          })),
          { label: $t('api-key.options.custom'), value: 'custom' },
        ],
      }),
      defaultValue: 0,
      dependencies: {
        if: () => !record.value?.id?.id,
        triggerFields: ['description'],
      },
      fieldName: 'expirationPreset',
      label: $t('api-key.fields.expiration'),
    },
    {
      component: 'DatePicker',
      componentProps: () => ({
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        placeholder: $t('api-key.messages.expirationRequired'),
        disabledDate: (date: dayjs.Dayjs) => date.isBefore(dayjs(), 'day'),
      }),
      fieldName: 'expirationTime',
      label: $t('api-key.fields.customExpiration'),
      dependencies: {
        triggerFields: ['expirationPreset'],
        resolve: ({ values }) => ({
          if: !record.value?.id?.id && values.expirationPreset === 'custom',
          rules:
            !record.value?.id?.id && values.expirationPreset === 'custom'
              ? z
                  .string({ error: $t('api-key.messages.expirationRequired') })
                  .min(1, $t('api-key.messages.expirationRequired'))
                  .refine(
                    (value) =>
                      dayjs(value).isValid() && dayjs(value).isAfter(dayjs()),
                    {
                      message: $t('api-key.messages.expirationFuture'),
                    },
                  )
              : z.string().nullish(),
        }),
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal<{ apiKey?: ApiKeyInfo; userId: string }>(
  {
    async onConfirm() {
      const { userId } = modalApi.getData() ?? {};
      if (!userId || modalState.value.submitting) return;
      modalApi.lock();
      try {
        const { valid } = await formApi.validate();
        if (!valid) return;
        const values = await formApi.getValues();
        let token = '';
        if (record.value?.id?.id) {
          await updateApiKeyDescription(record.value.id.id, values.description);
        } else {
          let expirationTime = 0;
          if (values.expirationPreset === 'custom') {
            expirationTime = dayjs(values.expirationTime).valueOf();
          } else if (values.expirationPreset) {
            expirationTime =
              Date.now() + values.expirationPreset * 24 * 60 * 60 * 1000;
          }
          const apiKey = await saveApiKey({
            description: values.description,
            enabled: values.enabled ?? true,
            expirationTime,
            userId: {
              entityType: EntityType.USER,
              id: userId,
            },
          });
          token = apiKey.value ?? '';
        }
        message.success($t('tb.common.saveSuccess'));
        modalApi.close();
        emit('success');
        if (token) {
          confirm({
            content: () => h(TokenContent, { token }),
            containerClass: 'sm:w-[min(52rem,calc(100vw_-_2rem))]!',
            showCancel: false,
            title: $t('api-key.sections.tokenTitle'),
          }).catch(() => {});
        }
      } finally {
        modalApi.unlock();
      }
    },
    async onOpenChange(isOpen) {
      if (!isOpen) return;
      const { apiKey, userId } = modalApi.getData() ?? {};
      if (!userId || (apiKey && apiKey.userId.id !== userId)) {
        modalApi.close();
        return;
      }
      record.value = apiKey || null;
      await formApi.reset();
      modalApi.setState({
        title: apiKey
          ? $t('api-key.actions.edit')
          : $t('api-key.actions.create'),
      });
      if (apiKey) {
        await formApi.setValues({ description: apiKey.description });
      }
    },
  },
);
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
    :confirm-text="$t('tb.common.save')"
  >
    <Alert
      v-if="!record?.id?.id"
      :title="$t('api-key.messages.inheritTip')"
      type="warning"
      class="!mb-4"
      show-icon
    />
    <Form />
  </Modal>
</template>
