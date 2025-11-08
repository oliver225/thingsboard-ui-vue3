<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item :label="t('tb.ruleChain.nodeAction.unassignFromSpecificCustomer')">
      <Switch v-model:checked="unassignFromSpecificCustomer" @change="handleSwitchChange" />
    </Form.Item>
    <Form.Item
      v-if="unassignFromSpecificCustomer"
      :label="t('tb.ruleChain.nodeAction.customerTitle')"
      name="customerNamePattern"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.customerNamePatternRequired') }]"
      :help="t('tb.ruleChain.nodeAction.customerNamePatternHelp')"
    >
      <Input v-model:value="formState.customerNamePattern" />
    </Form.Item>
    <!-- <Form.Item
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
    </Form.Item> -->
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'unassign-from-customer',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, InputNumber, Switch } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    customerCacheExpiration: number;
    customerNamePattern: string | null;
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
  const unassignFromSpecificCustomer = ref<boolean>(false);

  const formState = reactive<any>({
    customerCacheExpiration: 300,
    customerNamePattern: null,
  });

  watch(
    () => props.configuration,
    () => {
      formState.customerCacheExpiration = props.configuration.customerCacheExpiration;
      formState.customerNamePattern = props.configuration.customerNamePattern;
      // 根据 customerNamePattern 是否为 null 来判断 switch 状态
      unassignFromSpecificCustomer.value = props.configuration.customerNamePattern !== null;
    },
    { immediate: true },
  );

  function handleSwitchChange() {
    if (!unassignFromSpecificCustomer.value) {
      // 关闭 switch 时，将 customerNamePattern 设置为 null
      formState.customerNamePattern = null;
      // 清除该字段的验证错误
      formRef.value?.clearValidate('customerNamePattern');
    }
  }

  async function getConfiguration() {
    try {
      if (unassignFromSpecificCustomer.value) {
        // 如果 switch 开启，验证表单
        return await formRef.value?.validate();
      } else {
        // 如果 switch 关闭，只验证除 customerNamePattern 外的字段
        const values = await formRef.value?.validate();
        return {
          ...values,
          customerNamePattern: null,
        };
      }
    } catch (error: any) {
      throw error;
    }
  }

  defineExpose({ getConfiguration });
</script>
