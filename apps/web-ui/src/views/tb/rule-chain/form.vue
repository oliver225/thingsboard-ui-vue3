<script lang="ts" setup>
/**
 * 规则链 新建/编辑 弹窗
 * 仅维护基础信息(名称/调试模式/描述);节点与连线编辑(X6 流程图)为独立大模块,暂未实现。
 */
import type { RuleChain } from '#/api/tb/rule-chain';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getRuleChainById, saveRuleChain } from '#/api/tb/rule-chain';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<null | RuleChain>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    labelWidth: 100,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('tb.ruleChain.fields.name'),
      rules: z
        .string()
        .min(1, { message: $t('tb.ruleChain.validation.nameRequired') }),
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'debugMode',
      label: $t('tb.ruleChain.fields.debugMode'),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.ruleChain.fields.description'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const ruleChain: RuleChain = {
      ...record.value,
      additionalInfo: {
        ...record.value?.additionalInfo,
        description: values.description,
      },
      debugMode: values.debugMode,
      name: values.name,
      // 新建默认为 CORE 类型;编辑保留原 type
      type: record.value?.type ?? 'CORE',
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
    const { ruleChainId } = modalApi.getData<{ ruleChainId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: ruleChainId
        ? $t('tb.ruleChain.actions.edit')
        : $t('tb.ruleChain.actions.create'),
    });
    if (ruleChainId) {
      const ruleChain = await getRuleChainById(ruleChainId);
      record.value = ruleChain;
      await formApi.setValues({
        debugMode: ruleChain.debugMode ?? false,
        description: ruleChain.additionalInfo?.description,
        name: ruleChain.name,
      });
    }
  },
});
</script>

<template>
  <Modal
    class="w-1/2"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Form />
  </Modal>
</template>
