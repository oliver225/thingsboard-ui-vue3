<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      name="useMetadataPeriodInSecondsPatterns"
      :help="t('tb.ruleChain.nodeAction.usePeriodInSecondsPatternHelp')"
    >
      <Checkbox v-model:checked="formState.useMetadataPeriodInSecondsPatterns">
        {{ t('tb.ruleChain.nodeAction.usePeriodInSecondsPattern') }}
      </Checkbox>
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.periodInSecondsPattern')"
      name="periodInSecondsPattern"
      v-if="formState.useMetadataPeriodInSecondsPatterns == true"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.periodInSecondsPatternRequired') }]"
      :help="t('tb.ruleChain.nodeAction.customerNamePatternHelp')"
    >
      <Input v-model:value="formState.periodInSecondsPattern" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.period')"
      name="periodInSeconds"
      v-if="formState.useMetadataPeriodInSecondsPatterns == false"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.periodRequired') }]"
    >
      <InputNumber
        v-model:value="formState.periodInSeconds"
        :addon-after="t('tb.ruleChain.nodeAction.unitSecond')"
        :style="{ width: '100%' }"
      />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.maxPendingMsgs')"
      name="maxPendingMsgs"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.maxPendingMsgsRequired') }]"
    >
      <InputNumber v-model:value="formState.maxPendingMsgs" :style="{ width: '100%' }" />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'delay-deprecated',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Checkbox, Input, InputNumber } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    maxPendingMsgs: number;
    periodInSeconds: number;
    periodInSecondsPattern: string;
    useMetadataPeriodInSecondsPatterns: boolean;
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
    maxPendingMsgs: 1000,
    periodInSeconds: 60,
    periodInSecondsPattern: undefined,
    useMetadataPeriodInSecondsPatterns: false,
  });

  watch(
    () => props.configuration,
    () => {
      formState.maxPendingMsgs = props.configuration.maxPendingMsgs;
      formState.periodInSeconds = props.configuration.periodInSeconds;
      formState.periodInSecondsPattern = props.configuration.periodInSecondsPattern;
      formState.useMetadataPeriodInSecondsPatterns = props.configuration.useMetadataPeriodInSecondsPatterns;
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
