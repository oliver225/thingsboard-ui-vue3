<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.defaultTTL')"
      name="defaultTTL"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.defaultTTLRequired') }]"
    >
      <InputNumber v-model:value="formState.defaultTTL" :style="{ width: '100%' }" />
    </Form.Item>
    <Form.Item name="skipLatestPersistence">
      <Checkbox v-model:checked="formState.skipLatestPersistence">{{
        t('tb.ruleChain.nodeAction.skipLatestPersistence')
      }}</Checkbox>
    </Form.Item>
    <Form.Item name="useServerTs" :help="t('tb.ruleChain.nodeAction.useServerTsHelp')">
      <Checkbox v-model:checked="formState.useServerTs">{{ t('tb.ruleChain.nodeAction.useServerTs') }}</Checkbox>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'save-timeseries',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, InputNumber, Checkbox } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    defaultTTL: number;
    skipLatestPersistence: boolean;
    useServerTs: boolean;
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    defaultTTL: 0,
    skipLatestPersistence: false,
    useServerTs: false,
  });

  watch(
    () => props.configuration,
    () => {
      formState.defaultTTL = props.configuration.defaultTTL;
      formState.skipLatestPersistence = props.configuration.skipLatestPersistence;
      formState.useServerTs = props.configuration.useServerTs;
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
