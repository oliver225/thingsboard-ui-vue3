<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';
interface ConnectionData {
  edgeId: string;
  currentTypes?: string[];
  relationTypes?: string[];
  customRelations?: boolean;
}
const emit = defineEmits<{
  success: [value: { edgeId: string; currentTypes: string[] }];
  cancel: [value: { edgeId: string }];
}>();
const data = ref<ConnectionData>();
let confirmed = false;
const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: [
    {
      fieldName: 'currentTypes',
      label: $t('rule-chain.node.linkLabel'),
      component: 'Select',
      rules: z
        .array(z.string())
        .min(1, $t('rule-chain.node.linkLabelRequired')),
      componentProps: () => ({
        class: 'w-full',
        mode: data.value?.customRelations ? 'tags' : 'multiple',
        options: (data.value?.relationTypes ?? []).map((value) => ({
          label: value,
          value,
        })),
      }),
    },
  ],
});
const [Modal, modalApi] = useVbenModal<ConnectionData>({
  async onOpenChange(open) {
    if (!open) {
      return;
    }
    confirmed = false;
    const current = modalApi.getData();
    if (!current) return;
    data.value = cloneDeep(current);
    await formApi.setValues({ currentTypes: data.value.currentTypes ?? [] });
  },
  async onBeforeClose() {
    if (!confirmed && data.value) {
      if (data.value.currentTypes?.length) {
        const values = await formApi.getValues();
        emit('success', {
          edgeId: data.value.edgeId,
          currentTypes: values.currentTypes,
        });
      } else emit('cancel', { edgeId: data.value.edgeId });
    }
    return true;
  },
  async onConfirm() {
    if (!data.value) return;
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    confirmed = true;
    emit('success', {
      edgeId: data.value.edgeId,
      currentTypes: values.currentTypes,
    });
    modalApi.close();
  },
});
</script>
<template>
  <Modal
    :title="
      $t(
        data?.currentTypes?.length
          ? 'rule-chain.node.editNodeLink'
          : 'rule-chain.node.addNodeLink',
      )
    "
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <Form />
  </Modal>
</template>
