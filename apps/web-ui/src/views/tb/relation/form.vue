<script setup lang="ts">
import type { EntityRelationInfo } from '#/api/tb/relation';
import type { EntityId } from '#/types/tb';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { findEntityDataByQuery } from '#/api/tb/entity-query';
import { saveRelation } from '#/api/tb/relation';
import {
  Authority,
  EntityType,
  entityTypeLabel,
  RelationDirection,
  RelationTypeGroup,
} from '#/enums';
import { $t } from '#/locales';

const props = defineProps<{
  entityId: EntityId;
  direction: RelationDirection;
}>();
const emit = defineEmits<{ success: [] }>();
const { hasAccessByRoles } = useAccess();
const record = ref<EntityRelationInfo>();
const entitySearchText = ref('');

const entityTypeOptions = computed(() =>
  [
    EntityType.DEVICE,
    EntityType.ASSET,
    EntityType.ENTITY_VIEW,
    EntityType.DASHBOARD,
    ...(hasAccessByRoles([Authority.TENANT_ADMIN])
      ? [EntityType.CUSTOMER, EntityType.RULE_CHAIN]
      : []),
  ].map((value) => ({ value, label: entityTypeLabel(value) })),
);

const [Form, formApi] = useVbenForm<{
  type: string;
  relatedEntityType: EntityType;
  relatedEntityIds: string[];
  additionalInfo: string;
}>({
  layout: 'vertical',
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  commonConfig: { componentProps: { class: 'w-full' } },
  schema: [
    {
      fieldName: 'type',
      formItemClass: 'sm:col-span-2',
      component: 'AutoComplete',
      label: $t('relation.fields.type'),
      componentProps: () => ({
        disabled: !!record.value,
        options: [{ value: 'Contains' }, { value: 'Manages' }],
      }),
      rules: z.string().trim().min(1).max(255),
    },
    {
      fieldName: 'relatedEntityType',
      component: 'Select',
      label: $t('relation.fields.relatedEntityType'),
      componentProps: () => ({
        options: entityTypeOptions.value,
        disabled: !!record.value,
        onChange: handleEntityTypeChange,
      }),
      rules: 'selectRequired',
    },
    {
      fieldName: 'relatedEntityIds',
      component: 'ApiSelect',
      label: $t('relation.fields.relatedEntityId'),
      componentProps: () => ({
        api: fetchEntityOptions,
        key: formApi.form.values.relatedEntityType,
        params: {
          entityType: formApi.form.values.relatedEntityType,
          textSearch: entitySearchText.value,
        },
        mode: 'multiple',
        disabled: !!record.value,
        showSearch: true,
        filterOption: false,
        onSearch: (text: string) => {
          entitySearchText.value = text;
        },
      }),
      rules: z.array(z.string()).min(1),
    },
    {
      fieldName: 'additionalInfo',
      formItemClass: 'sm:col-span-2',
      component: 'JsonEditor',
      label: $t('relation.fields.additionalInfo'),
      componentProps: { height: 180 },
      rules: 'jsonRequired',
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ record?: EntityRelationInfo }>({
  async onOpenChange(open) {
    if (!open) return;
    entitySearchText.value = '';
    record.value = modalApi.getData()?.record;
    const entity =
      props.direction === RelationDirection.FROM
        ? record.value?.to
        : record.value?.from;
    modalApi.setState({
      title: record.value
        ? $t('relation.actions.edit')
        : $t('relation.actions.add'),
    });
    await formApi.reset({
      values: {
        type: record.value?.type ?? 'Contains',
        relatedEntityType: entity?.entityType ?? EntityType.DEVICE,
        relatedEntityIds: entity ? [entity.id] : [],
        additionalInfo: JSON.stringify(
          record.value?.additionalInfo ?? {},
          null,
          2,
        ),
      },
    });
  },
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    const additionalInfo = JSON.parse(values.additionalInfo);
    modalApi.lock();
    try {
      if (record.value) {
        const { from, to, type, typeGroup, version } = record.value;
        await saveRelation({
          from,
          to,
          type,
          typeGroup,
          version,
          additionalInfo,
        });
      } else {
        await Promise.all(
          values.relatedEntityIds.map((id) => {
            const entity = { id, entityType: values.relatedEntityType };
            return saveRelation({
              from:
                props.direction === RelationDirection.FROM
                  ? props.entityId
                  : entity,
              to:
                props.direction === RelationDirection.FROM
                  ? entity
                  : props.entityId,
              type: values.type,
              typeGroup: RelationTypeGroup.COMMON,
              additionalInfo,
            });
          }),
        );
      }
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});

async function handleEntityTypeChange() {
  await formApi.setFieldValue('relatedEntityIds', []);
  entitySearchText.value = '';
}

async function fetchEntityOptions({
  entityType,
  textSearch,
}: {
  entityType: EntityType;
  textSearch: string;
}) {
  if (record.value) {
    const entity =
      props.direction === RelationDirection.FROM
        ? record.value.to
        : record.value.from;
    const name =
      props.direction === RelationDirection.FROM
        ? record.value.toName
        : record.value.fromName;
    return [{ value: entity.id, label: name || entity.id }];
  }
  if (!entityType) return [];
  const result = await findEntityDataByQuery({
    entityFilter: { type: 'entityType', entityType },
    pageLink: {
      page: 0,
      pageSize: 1000,
      textSearch,
      sortOrder: {
        key: { type: 'ENTITY_FIELD', key: 'name' },
        direction: 'ASC',
      },
    },
    entityFields: [{ type: 'ENTITY_FIELD', key: 'name' }],
  });
  return result.data.map((entity) => ({
    value: entity.entityId.id,
    label: entity.latest.ENTITY_FIELD?.name?.value || entity.entityId.id,
  }));
}
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <Form />
  </Modal>
</template>
