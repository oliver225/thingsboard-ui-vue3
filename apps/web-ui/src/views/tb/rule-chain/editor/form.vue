<script setup lang="ts">
import type { NodeFormData, NodeFormValues } from './types';

import type { VbenFormSchema } from '#/adapter/form';
import type { RuleNode } from '#/api/tb/rule-chain';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { Alert } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import FormField from '#/adapter/form-field.vue';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import { nodeForms } from './configurations/index';
import ruleChainTypes from './configurations/rule-chain-types.json';

const emit = defineEmits<{
  success: [value: { nodeId: string; data: RuleNode }];
  cancel: [value: { nodeId: string }];
}>();

const record = ref<NodeFormData>();
const nodeType = computed(() => {
  const type = record.value?.data?.type ?? record.value?.descriptor.clazz;
  return ruleChainTypes[type as keyof typeof ruleChainTypes];
});
const definition = computed(() => nodeForms[nodeType.value]);
const configurationFields = computed(() =>
  record.value ? (definition.value?.createSchema?.(record.value) ?? []) : [],
);
let confirmed = false;

const [Form, formApi] = useVbenForm<NodeFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-[minmax(0,1fr)_auto]',
  showDefaultActions: false,
  schema: [],
});

function createNodeSchema(): VbenFormSchema<NodeFormValues>[] {
  const schema: VbenFormSchema<NodeFormValues>[] = [
    {
      fieldName: 'name',
      label: $t('rule-chain.node.name'),
      component: 'VbenInput',
      modelPropName: 'modelValue',
      defaultValue: '',
      rules: z.string().trim().min(1, $t('rule-chain.node.nameRequired')),
    },
    {
      fieldName: 'debugSettings',
      hideLabel: true,
      formItemClass: 'sm:self-end',
      component: 'DebugSettingsButton',
      componentProps: { debugType: 'ruleChain' },
    },
  ];
  const clusteringMode = record.value?.descriptor.clusteringMode;
  if (clusteringMode === 'SINGLETON' || clusteringMode === 'USER_PREFERENCE') {
    schema.push({
      fieldName: 'singletonMode',
      component: 'TbSwitch',
      componentProps: {
        title: $t('rule-chain.node.singletonMode'),
        disabled: clusteringMode === 'SINGLETON',
      },
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
    });
  }
  if (configurationFields.value.length > 0 || !definition.value) {
    schema.push({
      fieldName: '_configuration',
      component: 'VbenInput',
      hideLabel: true,
      controlClass: 'w-full min-w-0',
      formItemClass: 'sm:col-span-2',
    });
  }
  if (definition.value?.hasQueue) {
    schema.push({
      fieldName: 'queueName',
      label: $t('rule-chain.nodeAction.queue'),
      component: 'EntityInput',
      formItemClass: 'sm:col-span-2',
      description: $t('rule-chain.config.queueHelp'),
      componentProps: { entityType: 'QUEUE', valueField: 'name' },
    });
  }
  schema.push({
    fieldName: 'description',
    label: $t('rule-chain.node.description'),
    component: 'Textarea',
    componentProps: { rows: 3 },
    formItemClass: 'sm:col-span-2',
  });
  return schema;
}

async function getValidatedFormValues() {
  const { valid } = await formApi.validate();
  if (!valid) return;
  const formValues = await formApi.getValues();
  const errors = definition.value?.validate?.(formValues.configuration) ?? [];
  for (const error of errors)
    await formApi.setFieldError(error.fieldName, error.message);
  if (errors.length > 0) return;
  if (definition.value?.toConfiguration) {
    formValues.configuration = definition.value.toConfiguration(
      formValues.configuration,
    );
  }
  return formValues;
}

const [Modal, modalApi] = useVbenModal<NodeFormData>({
  async onOpenChange(open) {
    if (!open) {
      return;
    }
    confirmed = false;
    await formApi.reset();
    record.value = cloneDeep(modalApi.getData());
    if (!record.value) {
      return;
    }
    const node = record.value.data;
    modalApi.setState({
      title: `${node ? $t('rule-chain.node.editNode') : $t('rule-chain.node.addNode')} - ${record.value.descriptor.name}`,
      confirmDisabled: !definition.value,
    });
    formApi.setState({
      schema: createNodeSchema(),
    });
    const configuration = cloneDeep(
      node?.configuration ??
        record.value.descriptor.configurationDescriptor.nodeDefinition
          .defaultConfiguration,
    );
    await formApi.setValues(
      {
        name: node?.name ?? '',
        queueName: node?.queueName ?? '',
        description: node?.additionalInfo?.description ?? '',
        debugSettings: node?.debugSettings ?? {},
        singletonMode:
          node?.singletonMode ??
          ['SINGLETON', 'USER_PREFERENCE'].includes(
            record.value.descriptor.clusteringMode ?? '',
          ),
        configuration:
          definition.value?.getValues?.(configuration) ?? configuration,
      },
      false,
    );
  },
  onBeforeClose() {
    if (!confirmed && record.value && !record.value.data) {
      emit('cancel', { nodeId: record.value.nodeId });
    }
    return true;
  },
  async onConfirm() {
    if (!record.value) return;
    modalApi.lock();
    try {
      const formValues = await getValidatedFormValues();
      if (!formValues) return;
      const node = record.value.data;
      emit('success', {
        nodeId: record.value.nodeId,
        data: cloneDeep({
          ...node,
          type: node?.type ?? record.value.descriptor.clazz,
          configurationVersion:
            node?.configurationVersion ??
            record.value.descriptor.configurationVersion,
          ruleChainId: record.value.ruleChainId,
          name: formValues.name.trim(),
          ...(definition.value?.hasQueue
            ? { queueName: formValues.queueName || '' }
            : {}),
          debugSettings: formValues.debugSettings,
          singletonMode: formValues.singletonMode,
          configuration: formValues.configuration,
          additionalInfo: {
            ...node?.additionalInfo,
            description: formValues.description,
          },
        }),
      });
      confirmed = true;
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl"
    content-class="px-6 pb-1 pt-5"
  >
    <Form>
      <template #_configuration>
        <FormSection
          v-if="definition && configurationFields.length"
          :title="definition.title ? definition.title : undefined"
          size="small"
          content-class="grid min-w-0 grid-cols-1 gap-x-5 sm:grid-cols-2"
        >
          <FormField
            v-for="(field, index) in configurationFields"
            :key="`${field.fieldName}-${index}`"
            :schema="field"
          />
        </FormSection>
        <Alert
          v-if="!definition"
          type="warning"
          show-icon
          :message="$t('rule-chain.editor.unknownNode')"
        />
      </template>
    </Form>
  </Modal>
</template>
