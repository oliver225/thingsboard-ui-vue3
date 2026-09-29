<script lang="ts" setup>
import type { RuleChain } from '#/api/tb/rule-chain';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getRuleChainById, saveRuleChain } from '#/api/tb/rule-chain';
import { $t } from '#/locales';

interface RuleChainFormValues {
  debugMode: boolean;
  description: string;
  name: string;
}

const emit = defineEmits<{
  success: [ruleChain: RuleChain, created: boolean];
}>();

const route = useRoute();
const record = ref<null | RuleChain>(null);

const [Form, formApi] = useVbenForm<RuleChainFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('rule-chain.features.form.namePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('rule-chain.fields.name'),
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('rule-chain.validation.nameRequired') })
        .max(255, { message: $t('rule-chain.validation.nameMaxLength') }),
    },
    {
      component: 'TbSwitch',
      componentProps: { title: $t('rule-chain.fields.debugMode') },
      defaultValue: false,
      fieldName: 'debugMode',
      hideLabel: true,
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('rule-chain.features.form.descriptionPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('rule-chain.fields.description'),
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ ruleChainId?: string }>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();

    const ruleChain: RuleChain = {
      ...record.value,
      additionalInfo: {
        ...record.value?.additionalInfo,
        description: formValues.description,
      },
      debugMode: formValues.debugMode,
      name: formValues.name.trim(),
      // 新建默认为 CORE 类型;编辑保留原 type
      type: record.value?.type ?? 'CORE',
    };

    const created = !record.value?.id?.id;
    modalApi.lock();
    try {
      const savedRuleChain = await saveRuleChain(ruleChain);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success', savedRuleChain, created);
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { ruleChainId } = modalApi.getData() ?? {};
    record.value = null;
    await formApi.reset();
    modalApi.setState({
      title: ruleChainId
        ? $t('rule-chain.actions.edit')
        : $t('rule-chain.actions.create'),
    });
    modalApi.lock();
    try {
      if (ruleChainId) {
        const ruleChain = await getRuleChainById(ruleChainId);
        record.value = ruleChain;
        await formApi.setValues({
          name: ruleChain.name,
          debugMode: ruleChain.debugMode ?? false,
          description: ruleChain.additionalInfo?.description ?? '',
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
    <Form />
  </Modal>
</template>
