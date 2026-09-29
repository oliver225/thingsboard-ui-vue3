<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { EntityView } from '#/api/tb/entity-view';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal, VbenSelect } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenForm, z } from '#/adapter/form';
import FormField from '#/adapter/form-field.vue';
import {
  getEntityViewById,
  getEntityViewTypes,
  saveEntityView,
} from '#/api/tb/entity-view';
import { getAttributeKeysByScope, getTimeseriesKeys } from '#/api/tb/telemetry';
import { FormSection } from '#/components/form-section';
import {
  AttributeScope,
  Authority,
  EntityType,
  entityTypeLabel,
} from '#/enums';
import { $t } from '#/locales';

interface EntityViewFormValues {
  name: string;
  type: string;
  entityType: EntityType.ASSET | EntityType.DEVICE;
  deviceId?: string;
  assetId?: string;
  keys: {
    attributes: { cs: string[]; sh: string[]; ss: string[] };
    timeseries: string[];
  };
  startTime?: null | string;
  endTime?: null | string;
  description?: string;
}

type KeyField =
  | 'keys.attributes.cs'
  | 'keys.attributes.sh'
  | 'keys.attributes.ss'
  | 'keys.timeseries';
type KeyScope = 'TIMESERIES' | AttributeScope;

const emit = defineEmits<{ success: [] }>();
const route = useRoute();
const { hasAccessByRoles } = useAccess();
const record = ref<EntityView | null>(null);
const typeOptions = ref<{ value: string }[]>([]);
const dateFormat = 'YYYY-MM-DD HH:mm:ss';
const entityTypeOptions = [EntityType.DEVICE, EntityType.ASSET].map(
  (value) => ({
    label: entityTypeLabel(value),
    value,
  }),
);

async function loadKeyOptions({
  entityType,
  id,
  scope,
}: {
  entityType: EntityViewFormValues['entityType'];
  id?: string;
  scope: KeyScope;
}) {
  if (!id) return [];
  const entityId = { entityType, id };
  const keys =
    scope === 'TIMESERIES'
      ? await getTimeseriesKeys(entityId)
      : await getAttributeKeysByScope(entityId, scope);
  return keys.map((key) => ({ label: key, value: key }));
}

function keySchema(
  fieldName: KeyField,
  label: string,
  scope: KeyScope,
): VbenFormSchema {
  return {
    fieldName,
    label,
    component: 'ApiSelect',
    defaultValue: [],
    componentProps: {
      api: loadKeyOptions,
      mode: 'tags',
      allowClear: true,
      optionFilterProp: 'label',
      placeholder: $t('entity-view.features.form.keysPlaceholder'),
    },
    dependencies: {
      triggerFields: ['entityType', 'deviceId', 'assetId'],
      resolve: ({ values: formValues }) => ({
        componentProps: {
          params: {
            entityType: formValues.entityType,
            id:
              formValues.entityType === EntityType.ASSET
                ? formValues.assetId
                : formValues.deviceId,
            scope,
          },
        },
      }),
    },
    formItemClass: 'sm:col-span-2',
  };
}

const attributeFields = [
  keySchema(
    'keys.attributes.cs',
    $t('entity-view.fields.clientAttributes'),
    AttributeScope.CLIENT_SCOPE,
  ),
  keySchema(
    'keys.attributes.sh',
    $t('entity-view.fields.sharedAttributes'),
    AttributeScope.SHARED_SCOPE,
  ),
  keySchema(
    'keys.attributes.ss',
    $t('entity-view.fields.serverAttributes'),
    AttributeScope.SERVER_SCOPE,
  ),
];
const timeseriesField = keySchema(
  'keys.timeseries',
  $t('entity-view.fields.timeseries'),
  'TIMESERIES',
);

const [Form, formApi] = useVbenForm<EntityViewFormValues>({
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
      fieldName: 'name',
      defaultValue: '',
      label: $t('entity-view.fields.name'),
      componentProps: {
        placeholder: $t('entity-view.features.form.namePlaceholder'),
      },
      rules: z
        .string()
        .trim()
        .min(1, $t('entity-view.validation.nameRequired'))
        .max(255, $t('entity-view.validation.nameMaxLength')),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'AutoComplete',
      fieldName: 'type',
      defaultValue: '',
      label: $t('entity-view.fields.type'),
      componentProps: () => ({
        options: typeOptions.value,
        placeholder: $t('entity-view.features.form.typePlaceholder'),
        filterOption: (input: string, option?: { value?: string }) =>
          !!option?.value?.toLowerCase().includes(input.toLowerCase()),
      }),
      rules: z
        .string()
        .trim()
        .min(1, $t('entity-view.validation.typeRequired'))
        .max(255, $t('entity-view.validation.typeMaxLength')),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenSelect',
      fieldName: 'entityType',
      defaultValue: EntityType.DEVICE,
      label: $t('entity-view.fields.entityType'),
      componentProps: { options: entityTypeOptions },
      rules: z.enum([EntityType.DEVICE, EntityType.ASSET]),
    },
    {
      component: 'EntityInput',
      fieldName: 'deviceId',
      label: $t('entity-view.fields.entity'),
      componentProps: {
        entityType: 'DEVICE',
        params: {
          sortOrder: {
            key: { type: 'ENTITY_FIELD', key: 'name' },
            direction: 'ASC',
          },
        },
        showSearch: true,
        placeholder: $t('entity-view.validation.entityRequired'),
      },
      dependencies: {
        triggerFields: ['entityType'],
        resolve: ({ values: formValues }) => ({
          if: formValues.entityType === EntityType.DEVICE,
        }),
      },
      rules: z.string().min(1, $t('entity-view.validation.entityRequired')),
    },
    {
      component: 'EntityInput',
      fieldName: 'assetId',
      label: $t('entity-view.fields.entity'),
      componentProps: {
        entityType: 'ASSET',
        params: {
          sortOrder: {
            key: { type: 'ENTITY_FIELD', key: 'name' },
            direction: 'ASC',
          },
        },
        showSearch: true,
        placeholder: $t('entity-view.validation.entityRequired'),
      },
      dependencies: {
        triggerFields: ['entityType'],
        resolve: ({ values: formValues }) => ({
          if: formValues.entityType === EntityType.ASSET,
        }),
      },
      rules: z.string().min(1, $t('entity-view.validation.entityRequired')),
    },
    {
      fieldName: 'keys',
      component: 'VbenInput',
      defaultValue: { attributes: { cs: [], sh: [], ss: [] }, timeseries: [] },
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'DatePicker',
      fieldName: 'startTime',
      label: $t('entity-view.fields.startTime'),
      componentProps: {
        showTime: true,
        format: dateFormat,
        valueFormat: dateFormat,
        placeholder: $t('entity-view.features.form.noTimeLimit'),
      },
      help: $t('entity-view.features.form.timeHint'),
    },
    {
      component: 'DatePicker',
      fieldName: 'endTime',
      label: $t('entity-view.fields.endTime'),
      componentProps: {
        showTime: true,
        format: dateFormat,
        valueFormat: dateFormat,
        placeholder: $t('entity-view.features.form.noTimeLimit'),
      },
      dependencies: {
        triggerFields: ['startTime'],
        resolve: ({ values: formValues }) => ({
          rules: z
            .string()
            .nullable()
            .optional()
            .refine((end) => {
              const start = formValues.startTime;
              return (
                !start || !end || dayjs(end).valueOf() >= dayjs(start).valueOf()
              );
            }, $t('entity-view.validation.timeRange')),
        }),
      },
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      label: $t('entity-view.fields.description'),
      componentProps: {
        rows: 3,
        placeholder: $t('entity-view.features.form.descriptionPlaceholder'),
      },
      formItemClass: 'sm:col-span-2',
    },
  ],
});

function normalizeKeys(keys: string[] = []) {
  return [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
}

function handleEntityTypeChange(value?: string) {
  if (value === EntityType.DEVICE || value === EntityType.ASSET) {
    void formApi.setFieldValue('entityType', value);
  }
}

function toTimestamp(value?: null | string, original?: number) {
  if (!value) return 0;
  // 未修改时间时保留后端的毫秒精度。
  if (original && dayjs(original).format(dateFormat) === value) return original;
  return dayjs(value).valueOf();
}

const [Modal, modalApi] = useVbenModal<{ entityViewId?: string }>({
  async onConfirm() {
    if (
      modalState.value.submitting ||
      !hasAccessByRoles([Authority.TENANT_ADMIN])
    )
      return;
    modalApi.lock();
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;
      const formValues = await formApi.getValues();
      const startTimeMs = toTimestamp(
        formValues.startTime,
        record.value?.startTimeMs,
      );
      const endTimeMs = toTimestamp(
        formValues.endTime,
        record.value?.endTimeMs,
      );
      if (startTimeMs && endTimeMs && startTimeMs > endTimeMs) {
        formApi.setFieldError(
          'endTime',
          $t('entity-view.validation.timeRange'),
        );
        return;
      }
      const entityId =
        formValues.entityType === EntityType.ASSET
          ? formValues.assetId
          : formValues.deviceId;
      if (!entityId) return;
      await saveEntityView({
        ...record.value,
        name: formValues.name.trim(),
        type: formValues.type.trim(),
        entityId: {
          entityType: formValues.entityType,
          id: entityId,
        },
        keys: {
          ...record.value?.keys,
          attributes: {
            ...record.value?.keys?.attributes,
            cs: normalizeKeys(formValues.keys.attributes.cs),
            sh: normalizeKeys(formValues.keys.attributes.sh),
            ss: normalizeKeys(formValues.keys.attributes.ss),
          },
          timeseries: normalizeKeys(formValues.keys.timeseries),
        },
        startTimeMs,
        endTimeMs,
        additionalInfo: {
          ...record.value?.additionalInfo,
          description: formValues.description?.trim(),
        },
      });
      message.success($t('tb.common.saveSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    if (!hasAccessByRoles([Authority.TENANT_ADMIN])) {
      await modalApi.close();
      return;
    }
    modalApi.lock();
    try {
      record.value = null;
      await formApi.reset();
      const entityViewId = modalApi.getData()?.entityViewId;
      modalApi.setState({
        title: entityViewId
          ? $t('entity-view.actions.edit')
          : $t('entity-view.actions.create'),
      });
      const [types, entityView] = await Promise.all([
        getEntityViewTypes(),
        entityViewId ? getEntityViewById(entityViewId) : undefined,
      ]);
      typeOptions.value = types.map(({ type }) => ({ value: type }));
      if (entityView) {
        record.value = entityView;
        const entityType = entityView.entityId?.entityType ?? EntityType.DEVICE;
        await formApi.setValues({
          name: entityView.name,
          type: entityView.type,
          entityType,
          deviceId:
            entityType === EntityType.DEVICE
              ? entityView.entityId?.id
              : undefined,
          assetId:
            entityType === EntityType.ASSET
              ? entityView.entityId?.id
              : undefined,
          keys: {
            attributes: {
              cs: entityView.keys?.attributes?.cs ?? [],
              sh: entityView.keys?.attributes?.sh ?? [],
              ss: entityView.keys?.attributes?.ss ?? [],
            },
            timeseries: entityView.keys?.timeseries ?? [],
          },
          startTime: entityView.startTimeMs
            ? dayjs(entityView.startTimeMs).format(dateFormat)
            : null,
          endTime: entityView.endTimeMs
            ? dayjs(entityView.endTimeMs).format(dateFormat)
            : null,
          description: entityView.additionalInfo?.description,
        });
      }
    } catch {
      await modalApi.close();
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
    :confirm-text="$t('tb.common.save')"
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
    <Form class="form-message-flow">
      <template #entityType="{ componentProps }">
        <label class="block w-full">
          <span class="sr-only">{{ $t('entity-view.fields.entityType') }}</span>
          <VbenSelect
            v-bind="{
              ...componentProps,
              'onUpdate:modelValue': handleEntityTypeChange,
            }"
          />
        </label>
      </template>
      <template #keys>
        <div class="w-full space-y-5">
          <FormSection
            collapsible
            :title="$t('entity-view.sections.groups.attributes')"
            :description="$t('entity-view.features.form.attributesHint')"
          >
            <FormField
              v-for="field in attributeFields"
              :key="field.fieldName"
              :schema="field"
            />
          </FormSection>
          <FormSection
            collapsible
            :title="$t('entity-view.sections.groups.timeseries')"
            :description="$t('entity-view.features.form.timeseriesHint')"
          >
            <FormField :schema="timeseriesField" />
          </FormSection>
        </div>
      </template>
    </Form>
  </Modal>
</template>
