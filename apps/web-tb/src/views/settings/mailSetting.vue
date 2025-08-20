<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { AdminSetting } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Loading } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  InputPassword,
  message,
  Row,
  Select,
  Switch,
} from 'ant-design-vue';

import { getAdminSettingsApi, saveAdminSettingsApi, sendTestMail } from '#/api';
import { CollapseContainer } from '#/components/Container';
import { EntityType } from '#/constants';

defineOptions({
  name: 'GeneralSettings',
});
const formRef = ref<FormInstance>();

const record = ref<AdminSetting>({} as AdminSetting);

const loading = ref(false);

const formState = reactive<AdminSetting>({
  tenantId: { entityType: EntityType.TENANT, id: '' },
  key: 'mail',
  jsonValue: {
    mailFrom: '',
    providerId: 'CUSTOM',
    smtpProtocol: 'smtp',
    smtpHost: 'localhost',
    smtpPort: '25',
    timeout: '10000',
    username: '',
    password: '',
    enableTls: false,
    tlsVersion: 'TLSv1',
    enableProxy: false,
    proxyHost: '',
    proxyPort: '',
    proxyUser: '',
    proxyPassword: '',
    enableOauth2: false,
  },
} as AdminSetting);

onMounted(() => {
  fetchData();
});

function clear() {
  formState.tenantId = { entityType: EntityType.TENANT, id: '' };
  formState.key = 'mail';
  formState.jsonValue = {
    mailFrom: '',
    providerId: 'CUSTOM',
    smtpProtocol: 'smtp',
    smtpHost: 'localhost',
    smtpPort: '25',
    timeout: '10000',
    username: '',
    password: '',
    enableTls: false,
    tlsVersion: 'TLSv1',
    enableProxy: false,
    proxyHost: '',
    proxyPort: '',
    proxyUser: '',
    proxyPassword: '',
    enableOauth2: false,
  };
}

async function fetchData() {
  try {
    loading.value = true;
    clear();
    record.value = await getAdminSettingsApi('mail');
    Object.keys(record.value).forEach((key) => {
      const k = key as keyof AdminSetting;
      formState[k] = record.value[k];
    });
    formState.jsonValue.providerId = 'CUSTOM';
    // handleTLSEnableChange(result?.jsonValue?.enableTls || false);
    // handleProxyEnableChange(result?.jsonValue?.enableProxy || false);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  message.loading({
    content: `${$t('page.submit.loading')}`,
    duration: 0,
    key: 'is-form-submitting',
  });
  try {
    const data = await formRef.value?.validate();
    loading.value = true;
    // console.log('submit', params, data, record);
    await saveAdminSettingsApi({ ...record.value, ...data });
    fetchData();
    message.success({
      content: `${$t('保存通用配置成功！')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } catch (error: any) {
    message.error({
      content: error.message || `${$t('page.submit.error')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } finally {
    loading.value = false;
  }
}

function handleTlsEnableChange(tlsEnable: any) {
  formState.jsonValue.tlsVersion = tlsEnable === true ? 'TLSv1' : undefined;
}

function handleProxyEnableChange(proxyEnable: any) {
  formState.jsonValue.proxyHost = proxyEnable === true ? '' : undefined;
  formState.jsonValue.proxyPort = proxyEnable === true ? '25' : undefined;
  formState.jsonValue.proxyUser =
    proxyEnable === true ? 'sysadmin@thingsboard.org' : undefined;
  formState.jsonValue.proxyPassword =
    proxyEnable === true ? 'sysadmin' : undefined;
}

async function handleSendTestMail() {
  try {
    const data = await formRef.value?.validate();
    loading.value = true;
    await sendTestMail({ ...record.value, ...data });
    message.success({
      content: `${$t('发送测试邮件成功！')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } catch (error: any) {
    message.error({
      content: error.message || `${$t('page.submit.error')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <div>
    <Loading :spinning="loading">
      <template #icon>
        <IconifyIcon
          icon="svg-spinners:bars-scale"
          class="text-primary size-12"
        />
      </template>
      <div class="my-2 text-lg font-semibold">发送邮件配置</div>
      <Form ref="formRef" :model="formState" layout="vertical">
        <Form.Item
          label="邮件来自"
          :name="['jsonValue', 'mailFrom']"
          :rules="[{ required: true }]"
        >
          <Input v-model:value="formState.jsonValue.mailFrom" />
        </Form.Item>
        <Form.Item
          label="SMTP供应商"
          :name="['jsonValue', 'providerId']"
          :rules="[{ required: true }]"
        >
          <Input
            v-model:value="formState.jsonValue.providerId"
            :disabled="true"
          />
        </Form.Item>
        <CollapseContainer
          title="连接设置"
          :can-expan="true"
          class="mb-4 border border-solid border-neutral-300"
        >
          <div class="px-4">
            <Row :gutter="24">
              <Col :span="24">
                <Form.Item
                  label="SMTP协议"
                  :name="['jsonValue', 'smtpProtocol']"
                  :rules="[{ required: true }]"
                >
                  <Select v-model:value="formState.jsonValue.smtpProtocol">
                    <Select.Option value="smtp">SMTP</Select.Option>
                    <Select.Option value="smtps">SMTPS</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="SMTP主机"
                  :name="['jsonValue', 'smtpHost']"
                  :rules="[{ required: true }]"
                >
                  <Input v-model:value="formState.jsonValue.smtpHost" />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="SMTP端口"
                  :name="['jsonValue', 'smtpPort']"
                  :rules="[{ required: true }]"
                >
                  <InputNumber
                    v-model:value="formState.jsonValue.smtpPort"
                    :min="1"
                    :max="65535"
                    style="width: calc(90%)"
                  />
                </Form.Item>
              </Col>
              <Col :span="24">
                <Form.Item
                  label="超时时间(毫秒)"
                  :name="['jsonValue', 'timeout']"
                  :rules="[{ required: true }]"
                >
                  <InputNumber
                    v-model:value="formState.jsonValue.timeout"
                    :min="0"
                    addon-after="毫秒"
                    style="width: calc(90%)"
                  />
                </Form.Item>
              </Col>
              <Col :span="24">
                <Form.Item :name="['jsonValue', 'enableTls']">
                  <Switch
                    v-model:checked="formState.jsonValue.enableTls"
                    @change="handleTlsEnableChange"
                  />
                  <span class="ml-2 text-base font-bold"> 启用TLS </span>
                </Form.Item>
              </Col>
              <Col :span="24" v-if="formState.jsonValue.enableTls === true">
                <Form.Item
                  :name="['jsonValue', 'tlsVersion']"
                  :rules="[{ required: true }]"
                >
                  <Select v-model:value="formState.jsonValue.tlsVersion">
                    <Select.Option value="TLSv1">TLSv1</Select.Option>
                    <Select.Option value="TLSv1.1">TLSv1.1</Select.Option>
                    <Select.Option value="TLSv1.2">TLSv1.2</Select.Option>
                    <Select.Option value="TLSv1.3">TLSv1.3</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col :span="24">
                <Form.Item :name="['jsonValue', 'enableProxy']">
                  <Switch
                    v-model:checked="formState.jsonValue.enableProxy"
                    @change="handleProxyEnableChange"
                  />
                  <span class="ml-2 text-base font-bold"> 启用代理 </span>
                </Form.Item>
              </Col>
              <Col :span="12" v-if="formState.jsonValue.enableProxy === true">
                <Form.Item
                  label="代理主机"
                  :name="['jsonValue', 'proxyHost']"
                  :rules="[{ required: true }]"
                >
                  <Input v-model:value="formState.jsonValue.proxyHost" />
                </Form.Item>
              </Col>
              <Col :span="12" v-if="formState.jsonValue.enableProxy === true">
                <Form.Item
                  label="代理端口"
                  :name="['jsonValue', 'proxyPort']"
                  :rules="[{ required: true }]"
                >
                  <InputNumber
                    v-model:value="formState.jsonValue.proxyPort"
                    :min="1"
                    :max="65535"
                    style="width: calc(90%)"
                  />
                </Form.Item>
              </Col>
              <Col :span="12" v-if="formState.jsonValue.enableProxy === true">
                <Form.Item label="代理用户" :name="['jsonValue', 'proxyUser']">
                  <Input v-model:value="formState.jsonValue.proxyUser" />
                </Form.Item>
              </Col>
              <Col :span="12" v-if="formState.jsonValue.enableProxy === true">
                <Form.Item
                  label="代理密码"
                  :name="['jsonValue', 'proxyPassword']"
                >
                  <InputPassword
                    v-model:value="formState.jsonValue.proxyPassword"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </CollapseContainer>
        <CollapseContainer
          title="身份验证"
          :can-expan="false"
          class="mb-4 border border-solid border-neutral-300"
        >
          <div class="px-4">
            <Form.Item label="用户名" :name="['jsonValue', 'username']">
              <Input v-model:value="formState.jsonValue.username" />
            </Form.Item>
            <Form.Item label="修改密码" :name="['jsonValue', 'password']">
              <InputPassword v-model:value="formState.jsonValue.password" />
            </Form.Item>
          </div>
        </CollapseContainer>
      </Form>
      <div class="flex gap-4">
        <Button @click="fetchData" class="w-24">
          <IconifyIcon icon="ant-design:reload-outlined" />
          重置
        </Button>
        <Button :loading="loading" @click="handleSendTestMail">
          <IconifyIcon icon="ant-design:send-outlined" />
          发送测试邮件
        </Button>
        <Button
          :loading="loading"
          class="w-24"
          type="primary"
          @click="handleSubmit"
        >
          <IconifyIcon icon="ant-design:check-outlined" />
          保存
        </Button>
      </div>
    </Loading>
  </div>
</template>
