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
    <Form.Item name="createCustomerIfNotExists">
      <Checkbox v-model:checked="formState.createCustomerIfNotExists">
        {{ t('tb.ruleChain.nodeAction.createNewCustomer') }}
      </Checkbox>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'assign-to-customer',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Checkbox, Form, Input, InputNumber } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    createCustomerIfNotExists: boolean;
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
    createCustomerIfNotExists: false,
    customerNamePattern: '',
  });

  watch(
    () => props.configuration,
    () => {
      formState.createCustomerIfNotExists = props.configuration.createCustomerIfNotExists;
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
