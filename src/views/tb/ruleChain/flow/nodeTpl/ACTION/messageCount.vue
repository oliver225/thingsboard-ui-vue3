<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item :label="t('tb.ruleChain.nodeAction.interval')" name="interval" :rules="[{ required: true }]">
      <InputNumber
        v-model:value="formState.interval"
        :addon-after="t('tb.ruleChain.nodeAction.unitSecond')"
        :style="{ width: '100%' }"
      />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.telemetryPrefix')"
      name="telemetryPrefix"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.telemetryPrefixRequired') }]"
    >
      <Input v-model:value="formState.telemetryPrefix" />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'message-count',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, InputNumber } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    interval: number;
    telemetryPrefix: string;
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
    interval: 1,
    telemetryPrefix: 'messageCount',
  });

  watch(
    () => props.configuration,
    () => {
      formState.interval = props.configuration.interval;
      formState.telemetryPrefix = props.configuration.telemetryPrefix;
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
