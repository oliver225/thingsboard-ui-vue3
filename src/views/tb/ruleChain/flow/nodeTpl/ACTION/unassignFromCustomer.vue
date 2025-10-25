<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.customerNamePattern')"
      name="customerNamePattern"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.customerNamePatternRequired') }]"
      :help="t('tb.ruleChain.nodeAction.customerNamePatternHelp')"
    >
      <Input v-model:value="formState.customerNamePattern" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.customerCacheExpiration')"
      name="customerCacheExpiration"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.customerCacheExpirationRequired') }]"
      :help="t('tb.ruleChain.nodeAction.customerCacheExpirationHelp')"
    >
      <InputNumber
        v-model:value="formState.customerCacheExpiration"
        :addon-after="t('tb.ruleChain.nodeAction.unitSecond')"
        :style="{ width: '100%' }"
      />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'unassign-from-customer',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, InputNumber } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    customerCacheExpiration: number;
    customerNamePattern: string;
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
    customerCacheExpiration: 300,
    customerNamePattern: undefined,
  });

  watch(
    () => props.configuration,
    () => {
      formState.customerCacheExpiration = props.configuration.customerCacheExpiration;
      formState.customerNamePattern = props.configuration.customerNamePattern;
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
