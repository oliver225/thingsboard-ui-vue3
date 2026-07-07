<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { EntityRelation, EntityRelationInfo } from '#/api/tb/relation';
import type { EntityId } from '#/types/tb';

import { ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { saveRelation } from '#/api/tb/relation';
import {
  Authority,
  EntityType,
  RelationDirection,
  relationDirectionOptions,
  RelationTypeGroup,
} from '#/enums';
import { $t } from '#/locales';

interface RelationFormValues {
  additionalInfo?: string;
  direction: RelationDirection;
  targetEntities: EntityId[];
  type: string;
}

const emit = defineEmits<{ success: [] }>();

const entityType = ref<EntityType | string>('');
const entityId = ref('');
const editingRelation = ref<EntityRelationInfo | null>(null);

const { hasAccessByRoles } = useAccess();

const schema: VbenFormSchema[] = [
  {
    component: 'RadioGroup',
    componentProps: () => ({
      buttonStyle: 'solid',
      disabled: !!editingRelation.value,
      optionType: 'button',
      options: relationDirectionOptions(),
    }),
    defaultValue: RelationDirection.FROM,
    fieldName: 'direction',
    formItemClass: 'col-span-full',
    label: $t('tb.relation.fields.direction'),
  },
  {
    component: 'Input',
    componentProps: () => ({
      allowClear: true,
      disabled: !!editingRelation.value,
    }),
    defaultValue: 'Contains',
    fieldName: 'type',
    formItemClass: 'col-span-full',
    label: $t('tb.relation.fields.type'),
    rules: 'required',
  },
  {
    component: 'EntityListSelect',
    componentProps: () => ({
      additionEntityTypes: hasAccessByRoles([Authority.TENANT_ADMIN])
        ? [EntityType.RULE_CHAIN]
        : [],
      class: 'w-full',
      disabled: !!editingRelation.value,
      multiple: true,
    }),
    fieldName: 'targetEntities',
    formItemClass: 'col-span-full',
    label: $t('tb.relation.fields.relatedEntityId'),
    rules: 'required',
  },
  {
    component: 'Textarea',
    componentProps: {
      placeholder: '{\n  "description": ""\n}',
      rows: 5,
    },
    fieldName: 'additionalInfo',
    formItemClass: 'col-span-full',
    label: $t('tb.relation.fields.additionalInfo'),
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: { colon: true, labelWidth: 110 },
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<RelationFormValues>();
    let additionalInfo: Record<string, any> | undefined;
    if (values.additionalInfo?.trim()) {
      try {
        additionalInfo = JSON.parse(values.additionalInfo);
      } catch {
        message.error($t('tb.relation.validation.invalidJson'));
        return;
      }
    }

    const current = {
      entityType: entityType.value as EntityType,
      id: entityId.value,
    };
    const relations: EntityRelation[] = values.targetEntities.map((related) => {
      return {
        additionalInfo,
        from: values.direction === RelationDirection.FROM ? current : related,
        to: values.direction === RelationDirection.FROM ? related : current,
        type: values.type.trim(),
        typeGroup: RelationTypeGroup.COMMON,
      };
    });

    modalApi.lock();
    try {
      await (editingRelation.value
        ? saveRelation({
            ...editingRelation.value,
            additionalInfo,
          })
        : Promise.all(relations.map((relation) => saveRelation(relation))));
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data =
      modalApi.getData<{
        entityId?: string;
        entityType?: EntityType | string;
        relation?: EntityRelationInfo;
      }>() ?? {};
    entityType.value = data.entityType ?? '';
    entityId.value = data.entityId ?? '';
    editingRelation.value = data.relation ?? null;

    await formApi.resetForm();
    if (editingRelation.value) {
      const isFromCurrent =
        editingRelation.value.from.entityType === entityType.value &&
        editingRelation.value.from.id === entityId.value;
      await formApi.setValues({
        additionalInfo: editingRelation.value.additionalInfo
          ? JSON.stringify(editingRelation.value.additionalInfo, null, 2)
          : undefined,
        direction: isFromCurrent
          ? RelationDirection.FROM
          : RelationDirection.TO,
        targetEntities: [
          isFromCurrent ? editingRelation.value.to : editingRelation.value.from,
        ],
        type: editingRelation.value.type,
      });
      modalApi.setState({ title: $t('tb.common.edit') });
      return;
    }

    await formApi.setValues({ targetEntities: [] });
    modalApi.setState({ title: $t('tb.relation.actions.add') });
  },
});
</script>

<template>
  <Modal
    class="w-1/3"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Form />
  </Modal>
</template>
