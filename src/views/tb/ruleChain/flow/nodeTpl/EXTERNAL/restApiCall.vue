<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.endpointUrlPattern')"
      name="restEndpointUrlPattern"
      :help="t('tb.ruleChain.nodeAction.topicPatternHelp')"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.endpointUrlPatternRequired') }]"
    >
      <Input v-model:value="formState.restEndpointUrlPattern" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.requestMethod')"
      name="requestMethod"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.requestMethodRequired') }]"
    >
      <Select v-model:value="formState.requestMethod">
        <Select.Option value="POST">POST</Select.Option>
        <Select.Option value="GET">GET</Select.Option>
        <Select.Option value="PUT">PUT</Select.Option>
        <Select.Option value="DELETE">DELETE</Select.Option>
      </Select>
    </Form.Item>
    <Form.Item name="enableProxy">
      <Checkbox v-model:checked="formState.enableProxy">{{ t('tb.ruleChain.nodeAction.enableProxy') }}</Checkbox>
    </Form.Item>
    <Form.Item name="useSimpleClientHttpFactory" v-if="formState.enableProxy == false">
      <Checkbox v-model:checked="formState.useSimpleClientHttpFactory">{{
        t('tb.ruleChain.nodeAction.useSimpleClientHttpFactory')
      }}</Checkbox>
    </Form.Item>
    <Form.Item name="parseToPlainText" :help="t('tb.ruleChain.nodeAction.parseToPlainTextHelp')">
      <Checkbox v-model:checked="formState.parseToPlainText">{{
        t('tb.ruleChain.nodeAction.parseToPlainText')
      }}</Checkbox>
    </Form.Item>
    <Form.Item name="ignoreRequestBody">
      <Checkbox v-model:checked="formState.ignoreRequestBody">{{
        t('tb.ruleChain.nodeAction.ignoreRequestBody')
      }}</Checkbox>
    </Form.Item>

    <Form.Item
      :label="t('tb.ruleChain.nodeAction.timeout')"
      name="readTimeoutMs"
      v-if="formState.useSimpleClientHttpFactory == false"
    >
      <InputNumber
        v-model:value="formState.readTimeoutMs"
        :min="0"
        :step="1"
        :precision="0"
        :style="{ width: '100%' }"
        :addonAfter="t('tb.ruleChain.nodeAction.unitMillisecond')"
      />
    </Form.Item>
    <Form.Item :label="t('tb.ruleChain.nodeAction.maxParallelRequestsCount')" name="maxParallelRequestsCount">
      <InputNumber
        v-model:value="formState.maxParallelRequestsCount"
        :min="0"
        :step="1"
        :precision="0"
        :style="{ width: '100%' }"
      />
    </Form.Item>
    <template v-if="formState.enableProxy == true">
      <Form.Item name="useSystemProxyProperties">
        <Checkbox v-model:checked="formState.useSystemProxyProperties">{{
          t('tb.ruleChain.nodeAction.useSystemProxyProperties')
        }}</Checkbox>
      </Form.Item>
      <Row :gutter="20" v-if="formState.useSystemProxyProperties == false">
        <Col :span="6">
          <Form.Item :label="t('tb.ruleChain.nodeAction.proxyScheme')" name="proxyScheme">
            <Select v-model:value="formState.proxyScheme" :style="{ width: '100%' }">
              <Select.Option value="http">http</Select.Option>
              <Select.Option value="https">https</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item :label="t('tb.ruleChain.nodeAction.proxyHost')" name="proxyHost">
            <Input v-model:value="formState.proxyHost" />
          </Form.Item>
        </Col>
        <Col :span="6">
          <Form.Item :label="t('tb.ruleChain.nodeAction.proxyPort')" name="proxyPort">
            <InputNumber
              v-model:value="formState.proxyPort"
              :min="1"
              :step="1"
              :precision="0"
              :style="{ width: '100%' }"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item :label="t('tb.ruleChain.nodeAction.proxyUser')" name="proxyUser">
            <Input v-model:value="formState.proxyUser" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item :label="t('tb.ruleChain.nodeAction.proxyPassword')" name="proxyPassword">
            <Input v-model:value="formState.proxyPassword" />
          </Form.Item>
        </Col>
      </Row>
    </template>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.httpHeaders')"
      name="headers"
      :rules="[{ validator: validatorHeader }]"
    >
      <Alert type="success" :message="t('tb.ruleChain.nodeAction.httpHeadersHelp')" />

      <Table class="header-table">
        <tr class="header">
          <th>{{ t('tb.ruleChain.nodeAction.header') }}</th>
          <th>{{ t('tb.ruleChain.nodeAction.value') }}</th>
        </tr>
        <tr class="content" v-for="(header, index) in headerList" :key="index">
          <td class="py-2 px-4">
            <Input v-model:value="header.key" :placeholder="t('tb.ruleChain.nodeAction.headerPlaceholder')" />
          </td>
          <td> <Input v-model:value="header.value" :placeholder="t('tb.ruleChain.nodeAction.valuePlaceholder')" /> </td>
          <td>
            <Tooltip :title="t('tb.ruleChain.nodeAction.delete')" class="pl-4">
              <Icon
                :icon="'ant-design:delete-outlined'"
                :size="20"
                color="red"
                class="cursor-pointer"
                @click="handleDeleteHeader(index)"
              />
            </Tooltip>
          </td>
        </tr>
      </Table>
      <Button class="my-4" type="primary" @click="handleAddHeader">{{ t('tb.ruleChain.nodeAction.addHeader') }}</Button>
    </Form.Item>
    <Form.Item name="useRedisQueueForMsgPersistence">
      <Checkbox v-model:checked="formState.useRedisQueueForMsgPersistence">{{
        t('tb.ruleChain.nodeAction.useRedisQueue')
      }}</Checkbox>
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
    name: 'rest-api-call',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Icon } from '/@/components/Icon';
  import {
    Form,
    Alert,
    Tooltip,
    Button,
    Input,
    Select,
    Checkbox,
    Collapse,
    Row,
    Col,
    InputNumber,
    InputPassword,
  } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    credentials: { type: string };
    enableProxy: boolean;
    headers: Recordable;
    ignoreRequestBody: boolean;
    maxParallelRequestsCount: number;
    parseToPlainText: boolean;
    proxyHost: string;
    proxyPassword: string;
    proxyPort: number;
    proxyScheme: string;
    proxyUser: string;
    readTimeoutMs: number;
    requestMethod: string;
    restEndpointUrlPattern: string;
    useRedisQueueForMsgPersistence: boolean;
    useSimpleClientHttpFactory: boolean;
    useSystemProxyProperties: boolean;
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const headerList = ref<Array<any>>([]);

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    credentials: { type: 'anonymous' },
    enableProxy: false,
    headers: { 'Content-Type': 'application/json' },
    ignoreRequestBody: false,
    maxParallelRequestsCount: 0,
    parseToPlainText: false,
    proxyHost: null,
    proxyPassword: null,
    proxyPort: 0,
    proxyScheme: null,
    proxyUser: null,
    readTimeoutMs: 0,
    requestMethod: 'POST',
    restEndpointUrlPattern: 'http://localhost/api',
    useRedisQueueForMsgPersistence: false,
    useSimpleClientHttpFactory: false,
    useSystemProxyProperties: false,
  });

  watch(
    () => props.configuration,
    () => {
      headerList.value = [];
      formState.credentials = props.configuration.credentials;
      formState.enableProxy = props.configuration.enableProxy;
      formState.headers = props.configuration.headers;
      formState.ignoreRequestBody = props.configuration.ignoreRequestBody;
      formState.maxParallelRequestsCount = props.configuration.maxParallelRequestsCount;
      formState.parseToPlainText = props.configuration.parseToPlainText;
      formState.proxyHost = props.configuration.proxyHost;
      formState.proxyPassword = props.configuration.proxyPassword;
      formState.proxyPort = props.configuration.proxyPort;
      formState.proxyScheme = props.configuration.proxyScheme;
      formState.proxyUser = props.configuration.proxyUser;
      formState.readTimeoutMs = props.configuration.readTimeoutMs;
      formState.requestMethod = props.configuration.requestMethod;
      formState.restEndpointUrlPattern = props.configuration.restEndpointUrlPattern;
      formState.useRedisQueueForMsgPersistence = props.configuration.useRedisQueueForMsgPersistence;
      formState.useSimpleClientHttpFactory = props.configuration.useSimpleClientHttpFactory;
      formState.useSystemProxyProperties = props.configuration.useSystemProxyProperties;
      Object.keys(formState.headers).forEach((key) => {
        headerList.value.push({ key: key, value: formState.headers[key] });
      });
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        headerList.value.forEach((header) => {
          data.headers[header.key] = header.value;
        });
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  function validatorHeader() {
    if (headerList.value.length < 1) {
      return Promise.reject(t('tb.ruleChain.nodeAction.headerRequired'));
    } else {
      let validateTag = true;
      headerList.value.forEach((mapping) => {
        if (isEmpty(mapping.key) || isEmpty(mapping.value)) {
          validateTag = false;
        }
      });
      if (!validateTag) {
        return Promise.reject(t('tb.ruleChain.nodeAction.headerNotEmpty'));
      } else {
        return Promise.resolve();
      }
    }
  }

  function handleDeleteHeader(index: number) {
    headerList.value.splice(index, 1);
  }

  function handleAddHeader() {
    headerList.value.push({ key: '', value: '' });
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
<style lang="less">
  .ant-form-item-has-error {
    .header-table {
      border: 1px solid #ff4d4f;
    }
  }

  .header-table {
    width: 100%;
    align: 'center';
    border: 1px solid @border-color-base;
    border-radius: 4px;

    .header {
      border-bottom: 1px solid @border-color-base;
    }

    th {
      padding: 10px 8px;
      text-align: left;
      color: @border-color-base;
    }

    .td {
      padding: 2px 2px;
    }
  }
</style>
