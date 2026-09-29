<script setup lang="ts">
import type { AttributeData, DeleteTimeseriesQuery } from '#/api/tb/telemetry';
import type { EntityId } from '#/types/tb';

import { shallowRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Badge } from '@vben-core/shadcn-ui';

import { message } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { deleteEntityTimeseries } from '#/api/tb/telemetry';
import { $t } from '#/locales';

const props = defineProps<{ entityId: EntityId }>();
const emit = defineEmits<{ success: [] }>();
const records = shallowRef<AttributeData[]>([]);
const dateFormat = 'YYYY-MM-DD HH:mm:ss';
const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  commonConfig: { componentProps: { class: 'w-full' } },
  schema: [
    {
      fieldName: 'strategy',
      formItemClass: 'sm:col-span-2',
      component: 'VbenSelect',
      label: $t('telemetry.delete.strategy'),
      defaultValue: 'all',
      componentProps: {
        options: ['all', 'exceptLatest', 'latest', 'period'].map((value) => ({
          value,
          label: $t(`telemetry.delete.${value}`),
        })),
      },
      rules: 'required',
    },
    {
      fieldName: 'startTime',
      component: 'DatePicker',
      label: $t('telemetry.delete.startTime'),
      rules: 'required',
      componentProps: {
        showTime: true,
        format: dateFormat,
        valueFormat: dateFormat,
      },
      dependencies: {
        triggerFields: ['strategy'],
        resolve: ({ values }) => ({ if: values.strategy === 'period' }),
      },
    },
    {
      fieldName: 'endTime',
      component: 'DatePicker',
      label: $t('telemetry.delete.endTime'),
      rules: 'required',
      componentProps: {
        showTime: true,
        format: dateFormat,
        valueFormat: dateFormat,
      },
      dependencies: {
        triggerFields: ['strategy'],
        resolve: ({ values }) => ({ if: values.strategy === 'period' }),
      },
    },
    {
      fieldName: 'rewriteLatest',
      formItemClass: 'sm:col-span-2',
      component: 'TbCheckbox',
      defaultValue: false,
      componentProps: { title: $t('telemetry.delete.rewriteLatest') },
      dependencies: {
        triggerFields: ['strategy'],
        resolve: ({ values }) => ({
          if: ['latest', 'period'].includes(values.strategy),
        }),
      },
    },
  ],
});
const [Modal, modalApi] = useVbenModal<{ records: AttributeData[] }>({
  title: $t('telemetry.actions.delete'),
  confirmText: $t('tb.common.delete'),
  async onOpenChange(open) {
    if (!open) return;
    records.value = modalApi.getData()?.records ?? [];
    await formApi.reset({
      values: {
        strategy: 'all',
        rewriteLatest: false,
        startTime: dayjs().subtract(1, 'hour').format(dateFormat),
        endTime: dayjs().format(dateFormat),
      },
    });
  },
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const { strategy, startTime, endTime, rewriteLatest } =
      await formApi.getValues();
    const startTs = dayjs(startTime).valueOf();
    const endTs = dayjs(endTime).valueOf();
    if (strategy === 'period' && startTs >= endTs) {
      formApi.setFieldError('endTime', $t('telemetry.delete.invalidPeriod'));
      return;
    }
    modalApi.lock();
    try {
      if (strategy === 'latest') {
        await Promise.all(
          records.value.map((row) =>
            deleteEntityTimeseries(props.entityId, {
              key: [row.key],
              startTs: row.lastUpdateTs,
              endTs: row.lastUpdateTs + 1,
              deleteLatest: true,
              rewriteLatestIfDeleted: rewriteLatest,
            }),
          ),
        );
      } else {
        const params: DeleteTimeseriesQuery =
          strategy === 'period'
            ? {
                startTs,
                endTs,
                deleteLatest: true,
                rewriteLatestIfDeleted: rewriteLatest,
              }
            : {
                deleteAllDataForKeys: true,
                deleteLatest: strategy !== 'exceptLatest',
              };
        await deleteEntityTimeseries(props.entityId, {
          ...params,
          key: records.value.map((row) => row.key),
        });
      }
      message.success($t('tb.common.messages.delete.success'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[calc(100%_-_2rem)] max-w-xl" content-class="px-6 pt-5 pb-1">
    <div class="mb-4 flex flex-wrap gap-2">
      <Badge
        v-for="record in records"
        :key="record.key"
        variant="secondary"
        class="max-w-full whitespace-normal break-all text-sm"
      >
        {{ record.key }}
      </Badge>
    </div>
    <Form />
  </Modal>
</template>
