<script lang="ts" setup>
import type { RuleChain } from '#/api/tb/rule-chain';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Alert, message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getRuleChainById, saveRuleChain } from '#/api/tb/rule-chain';
import { $t } from '#/locales';

interface RuleChainFormValues {
  debugMode: boolean;
  description: string;
  name: string;
}

const emit = defineEmits<{ success: [] }>();

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
        placeholder: $t(
          'edge-management.features.ruleChains.form.namePlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('edge-management.features.ruleChains.fields.name'),
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t(
            'edge-management.features.ruleChains.validation.nameRequired',
          ),
        })
        .max(255, {
          message: $t(
            'edge-management.features.ruleChains.validation.nameMaxLength',
          ),
        }),
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('edge-management.features.ruleChains.fields.debugMode'),
        description: $t('edge-management.features.ruleChains.form.debugHint'),
      },
      defaultValue: false,
      fieldName: 'debugMode',
      hideLabel: true,
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t(
          'edge-management.features.ruleChains.form.descriptionPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('edge-management.features.ruleChains.fields.description'),
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ ruleChainId?: string }>({
  async onConfirm() {
    if (modalState.value.loading || modalState.value.submitting) return;
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
      // Edge 管理中的新建和编辑均保存为 EDGE 类型。
      type: 'EDGE',
    };

    modalApi.lock();
    try {
      await saveRuleChain(ruleChain);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
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
        ? $t('edge-management.features.ruleChains.actions.edit')
        : $t('edge-management.features.ruleChains.actions.create'),
    });
    modalApi.lock();
    try {
      if (ruleChainId) {
        const ruleChain = await getRuleChainById(ruleChainId);
        if (ruleChain.type !== 'EDGE') {
          message.error(
            $t('edge-management.features.ruleChains.validation.edgeOnly'),
          );
          modalApi.close();
          return;
        }
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
    <Alert
      class="mb-5 rounded-md"
      type="warning"
      show-icon
      :title="$t('edge-management.features.ruleChains.form.hint')"
    />
    <Form />
  </Modal>
</template>
