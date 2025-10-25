<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="useSystemSmtpSettings">
      <Checkbox v-model:checked="formState.useSystemSmtpSettings">
        {{ t('tb.ruleChain.nodeAction.useSystemSmtpSettings') }}
      </Checkbox>
    </Form.Item>
    <template v-if="formState.useSystemSmtpSettings == false">
      <Row :gutter="20">
        <Col :span="24">
          <Form.Item :label="t('tb.ruleChain.nodeAction.protocol')" name="smtpProtocol">
            <Select v-model:value="formState.smtpProtocol">
              <Select.Option value="smtp">SMTP</Select.Option>
              <Select.Option value="smtps">SMTPS</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.smtpHost')"
            name="smtpHost"
            :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.smtpHostRequired') }]"
          >
            <Input v-model:value="formState.smtpHost" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.smtpPort')"
            name="smtpPort"
            :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.smtpPortRequired') }]"
          >
            <InputNumber v-model:value="formState.smtpPort" :min="1" :max="65535" :style="{ width: '100%' }" />
          </Form.Item>
        </Col>
        <Col :span="24">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.timeout')"
            name="timeout"
            :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.timeoutRequired') }]"
          >
            <InputNumber v-model:value="formState.timeout" :min="0" :style="{ width: '100%' }" />
          </Form.Item>
        </Col>
        <Col :span="24">
          <Form.Item name="enableTls">
            <Checkbox v-model:checked="formState.enableTls"> {{ t('tb.ruleChain.nodeAction.enableTls') }} </Checkbox>
          </Form.Item>
        </Col>
        <Col :span="24" v-if="formState.enableTls == true">
          <Form.Item :label="t('tb.ruleChain.nodeAction.tlsVersion')" name="tlsVersion">
            <Select v-model:value="formState.tlsVersion">
              <Select.Option value="TLSv1">TLSv1</Select.Option>
              <Select.Option value="TLSv1.1">TLSv1.1</Select.Option>
              <Select.Option value="TLSv1.2">TLSv1.2</Select.Option>
              <Select.Option value="TLSv1.3">TLSv1.3</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="24">
          <Form.Item name="enableProxy">
            <Checkbox v-model:checked="formState.enableProxy">
              {{ t('tb.ruleChain.nodeAction.enableProxy') }}
            </Checkbox>
          </Form.Item>
        </Col>
        <template v-if="formState.enableProxy == true">
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.proxyHost')"
              name="proxyHost"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.proxyHostRequired') }]"
            >
              <Input v-model:value="formState.proxyHost" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.proxyPort')"
              name="proxyPort"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.proxyPortRequired') }]"
            >
              <InputNumber v-model:value="formState.proxyPort" :min="1" :max="65535" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
          <Col :span="24">
            <Form.Item :label="t('tb.ruleChain.nodeAction.proxyUser')" name="proxyUser">
              <Input v-model:value="formState.proxyUser" />
            </Form.Item>
          </Col>
          <Col :span="24">
            <Form.Item :label="t('tb.ruleChain.nodeAction.proxyPassword')" name="proxyPassword">
              <InputPassword v-model:value="formState.proxyPassword" />
            </Form.Item>
          </Col>
        </template>
        <Col :span="24">
          <Form.Item :label="t('tb.ruleChain.nodeAction.username')" name="username">
            <Input v-model:value="formState.username" />
          </Form.Item>
        </Col>
        <Col :span="24">
          <Form.Item :label="t('tb.ruleChain.nodeAction.password')" name="password">
            <InputPassword v-model:value="formState.password" />
          </Form.Item>
        </Col>
      </Row>
    </template>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'send-email',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Checkbox, Select, Input, Row, Col, InputNumber, InputPassword } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    enableProxy: boolean;
    enableTls: boolean;
    proxyHost: string;
    proxyPassword: string;
    proxyPort: string;
    proxyUser: string;
    smtpHost: string;
    smtpPort: number;
    smtpProtocol: string;
    timeout: number;
    tlsVersion: string;
    useSystemSmtpSettings: boolean;
    username: string;
    password: string;
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
    enableProxy: false,
    enableTls: false,
    proxyHost: null,
    proxyPassword: null,
    proxyPort: null,
    proxyUser: null,
    smtpHost: 'localhost',
    smtpPort: 25,
    smtpProtocol: 'smtp',
    timeout: 10000,
    tlsVersion: 'TLSv1.2',
    useSystemSmtpSettings: true,
    username: null,
    password: null,
  });

  watch(
    () => props.configuration,
    () => {
      formState.enableProxy = props.configuration.enableProxy;
      formState.enableTls = props.configuration.enableTls;
      formState.proxyHost = props.configuration.proxyHost;
      formState.proxyPassword = props.configuration.proxyPassword;
      formState.proxyPort = props.configuration.proxyPort;
      formState.proxyUser = props.configuration.proxyUser;
      formState.smtpHost = props.configuration.smtpHost;
      formState.smtpPort = props.configuration.smtpPort;
      formState.smtpProtocol = props.configuration.smtpProtocol;
      formState.timeout = props.configuration.timeout;
      formState.tlsVersion = props.configuration.tlsVersion;
      formState.useSystemSmtpSettings = props.configuration.useSystemSmtpSettings;
      formState.username = props.configuration.username;
      formState.password = props.configuration.password;
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
