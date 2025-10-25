<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.topicPattern')"
      name="topicPattern"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.topicPatternRequired') }]"
      :help="t('tb.ruleChain.nodeAction.topicPatternHelp')"
    >
      <Input v-model:value="formState.topicPattern" />
    </Form.Item>
    <Row :gutter="20">
      <Col :span="8">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.host')"
          name="host"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.hostRequired') }]"
        >
          <Input v-model:value="formState.host" />
        </Form.Item>
      </Col>
      <Col :span="8">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.port')"
          name="port"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.portRequired') }]"
        >
          <InputNumber
            v-model:value="formState.port"
            :min="1"
            :step="65535"
            :precision="0"
            :style="{ width: '100%' }"
          />
        </Form.Item>
      </Col>
      <Col :span="8">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.connectTimeout')"
          name="connectTimeoutSec"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.connectTimeoutRequired') }]"
        >
          <InputNumber
            v-model:value="formState.connectTimeoutSec"
            :min="0"
            :precision="0"
            :style="{ width: '100%' }"
            :addonAfter="t('tb.ruleChain.nodeAction.unitSecond')"
          />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.clientId')"
      name="clientId"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.clientIdRequired') }]"
      :help="t('tb.ruleChain.nodeAction.clientIdHelp')"
    >
      <Input v-model:value="formState.clientId" />
    </Form.Item>
    <Form.Item name="appendClientIdSuffix" :help="t('tb.ruleChain.nodeAction.appendClientIdSuffixHelp')">
      <Checkbox v-model:checked="formState.appendClientIdSuffix">
        {{ t('tb.ruleChain.nodeAction.appendClientIdSuffix') }}
      </Checkbox>
    </Form.Item>
    <Form.Item name="cleanSession">
      <Checkbox v-model:checked="formState.cleanSession"> {{ t('tb.ruleChain.nodeAction.cleanSession') }} </Checkbox>
    </Form.Item>
    <Form.Item name="retainedMessage">
      <Checkbox v-model:checked="formState.retainedMessage"> {{ t('tb.ruleChain.nodeAction.retained') }} </Checkbox>
    </Form.Item>
    <Form.Item name="ssl">
      <Checkbox v-model:checked="formState.ssl"> {{ t('tb.ruleChain.nodeAction.enableSSL') }} </Checkbox>
    </Form.Item>
    <Collapse expand-icon-position="end">
      <Collapse.Panel
        :header="t('tb.ruleChain.nodeAction.credentials') + '：' + '              ' + formState.credentials.type"
      >
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.credentialsType')"
          :name="['credentials', 'type']"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.credentialsTypeRequired') }]"
        >
          <Select
            v-model:value="formState.credentials.type"
            :style="{ width: '100%' }"
            @change="handleCredentialsTypeChange"
          >
            <Select.Option value="anonymous">{{ t('tb.ruleChain.nodeAction.anonymous') }}</Select.Option>
            <Select.Option value="basic">{{ t('tb.ruleChain.nodeAction.basic') }}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.username')"
          :name="['credentials', 'username']"
          v-if="formState.credentials.type == 'basic'"
        >
          <Input v-model:value="formState.credentials.username" />
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.password')"
          :name="['credentials', 'password']"
          v-if="formState.credentials.type == 'basic'"
        >
          <InputPassword v-model:value="formState.credentials.password" />
        </Form.Item>
      </Collapse.Panel>
    </Collapse>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'mqtt',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, Row, Col, InputNumber, InputPassword, Collapse, Checkbox, Select } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    appendClientIdSuffix: boolean;
    cleanSession: boolean;
    clientId: string;
    connectTimeoutSec: number;
    credentials: {
      type: 'anonymous' | 'basic';
    };
    host: string;
    port: number;
    retainedMessage: boolean;
    ssl: boolean;
    topicPattern: string;
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
    appendClientIdSuffix: false,
    cleanSession: true,
    clientId: undefined,
    connectTimeoutSec: 10,
    credentials: { type: 'anonymous' },
    host: undefined,
    port: 1883,
    retainedMessage: false,
    ssl: false,
    topicPattern: 'my-topic',
  });

  watch(
    () => props.configuration,
    () => {
      formState.appendClientIdSuffix = props.configuration.appendClientIdSuffix;
      formState.cleanSession = props.configuration.cleanSession;
      formState.clientId = props.configuration.clientId;
      formState.connectTimeoutSec = props.configuration.connectTimeoutSec;
      formState.credentials = props.configuration.credentials;
      formState.host = props.configuration.host;
      formState.port = props.configuration.port;
      formState.retainedMessage = props.configuration.retainedMessage;
      formState.ssl = props.configuration.ssl;
      formState.topicPattern = props.configuration.topicPattern;
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

  function handleCredentialsTypeChange(value) {
    if (value == 'basic') {
      formState.credentials = {
        type: 'basic',
        username: 'sysadmin@thingsboard.org',
        password: 'sysadmin',
      };
    } else if (value == 'anonymous') {
      formState.credentials = {
        type: 'anonymous',
      };
    }
  }

  defineExpose({ getConfiguration });
</script>
