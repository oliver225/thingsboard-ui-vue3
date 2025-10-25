<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.timeout')"
      name="timeoutInSeconds"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.timeoutRequired') }]"
    >
      <InputNumber
        v-model:value="formState.timeoutInSeconds"
        :addon-after="t('tb.ruleChain.nodeAction.unitSecond')"
        :style="{ width: '100%' }"
      />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'rpc-call-request',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, InputNumber } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    timeoutInSeconds: number;
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
    timeoutInSeconds: 60,
  });

  watch(
    () => props.configuration,
    () => {
      formState.timeoutInSeconds = props.configuration.timeoutInSeconds;
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
