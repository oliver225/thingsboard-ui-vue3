<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.phoneNumberTemplate')"
      name="numbersToTemplate"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.phoneNumberTemplateRequired') }]"
      :help="t('tb.ruleChain.nodeAction.phoneNumberTemplateHelp')"
    >
      <Input v-model:value="formState.numbersToTemplate" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.smsMessageTemplate')"
      name="smsMessageTemplate"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.smsMessageTemplateRequired') }]"
      :help="t('tb.ruleChain.nodeAction.smsMessageTemplateHelp')"
    >
      <Textarea v-model:value="formState.smsMessageTemplate" :rows="5" />
    </Form.Item>
    <Form.Item name="useSystemSmsSettings">
      <Checkbox v-model:checked="formState.useSystemSmsSettings" @change="handleUseSystemSmsChange">
        {{ t('tb.ruleChain.nodeAction.useSystemSmsProvider') }}
      </Checkbox>
    </Form.Item>
    <template v-if="!formState.useSystemSmsSettings">
      <Form.Item
        :label="t('tb.ruleChain.nodeAction.smsProvider')"
        :name="['smsProviderConfiguration', 'type']"
        :rules="[{ required: true }]"
      >
        <Select v-model:value="formState.smsProviderConfiguration.type" :disabled="true">
          <Select.Option value="ALI_SMS">{{ t('tb.ruleChain.nodeAction.aliyunSms') }}</Select.Option>
          <Select.Option value="AWS_SNS">{{ t('tb.ruleChain.nodeAction.awsSns') }}</Select.Option>
          <Select.Option value="TWILIO">{{ t('tb.ruleChain.nodeAction.twilio') }}</Select.Option>
          <Select.Option value="SMPP">{{ t('tb.ruleChain.nodeAction.smpp') }}</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        :label="t('tb.ruleChain.nodeAction.aliyunAccessKeyId')"
        :name="['smsProviderConfiguration', 'accessKeyId']"
        :rules="[{ required: true }]"
      >
        <Input v-model:value="formState.smsProviderConfiguration.accessKeyId" />
      </Form.Item>
      <Form.Item
        :label="t('tb.ruleChain.nodeAction.aliyunAccessKeySecret')"
        :name="['smsProviderConfiguration', 'accessKeySecret']"
        :rules="[{ required: true }]"
      >
        <InputPassword v-model:value="formState.smsProviderConfiguration.accessKeySecret" />
      </Form.Item>
      <Form.Item
        :label="t('tb.ruleChain.nodeAction.smsSignature')"
        :name="['smsProviderConfiguration', 'signName']"
        :rules="[{ required: true }]"
      >
        <Input v-model:value="formState.smsProviderConfiguration.signName" />
      </Form.Item>
      <Form.Item
        :label="t('tb.ruleChain.nodeAction.smsTemplateCode')"
        :name="['smsProviderConfiguration', 'templateCode']"
        :rules="[{ required: true }]"
      >
        <Input v-model:value="formState.smsProviderConfiguration.templateCode" />
      </Form.Item>
    </template>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'send-sms',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, InputPassword, Textarea, Checkbox, Select } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    numbersToTemplate: string;
    smsMessageTemplate: string;
    useSystemSmsSettings: boolean;
    smsProviderConfiguration: Recordable;
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
    numbersToTemplate: '${userPhone}',
    smsMessageTemplate: 'Device ${deviceName} has high temperature ${temp}',
    smsProviderConfiguration: {},
    useSystemSmsSettings: true,
  });

  watch(
    () => props.configuration,
    () => {
      formState.numbersToTemplate = props.configuration.numbersToTemplate;
      formState.smsMessageTemplate = props.configuration.smsMessageTemplate;
      formState.smsProviderConfiguration = props.configuration.smsProviderConfiguration;
      formState.useSystemSmsSettings = props.configuration.useSystemSmsSettings;
    },
    { immediate: true },
  );

  function handleUseSystemSmsChange(changeValue: any) {
    const checked = changeValue.target.checked;
    if (checked) {
      formState.smsProviderConfiguration = {};
    } else {
      formState.smsProviderConfiguration = {
        accessKeyId: '',
        accessKeySecret: '',
        signName: '',
        templateCode: '',
        type: 'ALI_SMS',
      };
    }
  }

  async function getConfiguration() {
    try {
      return await formRef.value?.validate();
    } catch (error: any) {
      throw error;
    }
  }

  defineExpose({ getConfiguration });
</script>
