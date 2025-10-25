<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item :label="t('tb.ruleChain.nodeAction.selectDetails')" name="detailsList" :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.selectDetailsRequired') }]">
      <Select v-model:value="formState.detailsList" :options="detailsOptions" mode="multiple" />
    </Form.Item>

    <Form.Item name="fetchTo">
      <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
        <span>{{ t('tb.ruleChain.nodeAction.addSelectedAttributesTo') }}</span>
        <Radio.Group v-model:value="formState.fetchTo" button-style="solid">
          <Radio.Button value="DATA">{{ t('tb.ruleChain.nodeAction.message') }}</Radio.Button>
          <Radio.Button value="METADATA">{{ t('tb.ruleChain.nodeAction.metadata') }}</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'tenant-details',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Radio, Select } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    detailsList: [];
    fetchTo: 'DATA' | 'METADATA';
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const detailsOptions = [
    { value: 'ID', label: t('tb.ruleChain.nodeAction.id') },
    { value: 'TITLE', label: t('tb.ruleChain.nodeAction.title') },
    { value: 'COUNTRY', label: t('tb.ruleChain.nodeAction.country') },
    { value: 'STATE', label: t('tb.ruleChain.nodeAction.state') },
    { value: 'CITY', label: t('tb.ruleChain.nodeAction.city') },
    { value: 'ZIP', label: t('tb.ruleChain.nodeAction.zip') },
    { value: 'ADDRESS', label: t('tb.ruleChain.nodeAction.address') },
    { value: 'ADDRESS2', label: t('tb.ruleChain.nodeAction.address2') },
    { value: 'PHONE', label: t('tb.ruleChain.nodeAction.phone') },
    { value: 'EMAIL', label: t('tb.ruleChain.nodeAction.email') },
    { value: 'ADDITIONAL_INFO', label: t('tb.ruleChain.nodeAction.additionalInfo') },
  ];

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    detailsList: [],
    fetchTo: 'DATA',
  });

  watch(
    () => props.configuration,
    () => {
      formState.detailsList = props.configuration.detailsList;
      formState.fetchTo = props.configuration.fetchTo;
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      return await formRef.value?.validate();
    } catch (error: any) {
      throw error;
    }
  }

  defineExpose({ getConfiguration });
</script>
