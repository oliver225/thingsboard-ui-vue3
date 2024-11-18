<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      label="手机号码模板"
      name="numbersToTemplate"
      :rules="[{ required: true, message: '请输入手机号码模板!' }]"
      help="逗号分隔的电话号码，使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值"
    >
      <Input v-model:value="formState.numbersToTemplate" />
    </Form.Item>
    <Form.Item
      label="短信消息模板"
      name="smsMessageTemplate"
      :rules="[{ required: true, message: '请输入短信消息模板!' }]"
      help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。"
    >
      <Textarea v-model:value="formState.smsMessageTemplate" :rows="5" />
    </Form.Item>
    <Form.Item name="useSystemSmsSettings">
      <Checkbox v-model:checked="formState.useSystemSmsSettings" @change="handleUseSystemSmsChange">
        使用系统短信提供商设置
      </Checkbox>
    </Form.Item>
    <template v-if="!formState.useSystemSmsSettings">
      <Form.Item
        label="短信服务商"
        :name="['smsProviderConfiguration', 'type']"
        :rules="[{ required: true }]"
      >
        <Select v-model:value="formState.smsProviderConfiguration.type" :disabled="true">
          <Select.Option value="ALI_SMS">阿里云短信</Select.Option>
          <Select.Option value="AWS_SNS">亚马逊短信</Select.Option>
          <Select.Option value="TWILIO">Twilio</Select.Option>
          <Select.Option value="SMPP">SMPP</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        label="阿里云访问秘钥ID"
        :name="['smsProviderConfiguration', 'accessKeyId']"
        :rules="[{ required: true }]"
      >
        <Input v-model:value="formState.smsProviderConfiguration.accessKeyId" />
      </Form.Item>
      <Form.Item
        label="阿里云访问秘钥"
        :name="['smsProviderConfiguration', 'accessKeySecret']"
        :rules="[{ required: true }]"
      >
        <InputPassword v-model:value="formState.smsProviderConfiguration.accessKeySecret" />
      </Form.Item>
      <Form.Item
        label="短信签名"
        :name="['smsProviderConfiguration', 'signName']"
        :rules="[{ required: true }]"
      >
        <Input v-model:value="formState.smsProviderConfiguration.signName" />
      </Form.Item>
      <Form.Item
        label="短信模板 Code"
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

  interface Configuration {
    numbersToTemplate: string;
    smsMessageTemplate: string;
    useSystemSmsSettings: boolean;
    smsProviderConfiguration: Recordable;
  }

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
