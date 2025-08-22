<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { AdminSetting } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Loading } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Form,
  Input,
  InputPassword,
  message,
  Modal,
  Select,
} from 'ant-design-vue';

import { getAdminSettingsApi, saveAdminSettingsApi, sendTestSms } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({
  name: 'SmsSettings',
});

const authStore = useAuthStore();

const formRef = ref<FormInstance>();
const testFromRef = ref<FormInstance>();

const record = ref<AdminSetting>({} as AdminSetting);

const loading = ref(false);

const showSmsTestModal = ref(false);

const formState = reactive<AdminSetting>({
  tenantId: authStore.getUserInfo().tenantId,
  key: 'sms',
  jsonValue: {
    accessKeyId: '',
    accessKeySecret: '',
    signName: '',
    templateCode: '',
    type: 'ALI_SMS',
  },
} as AdminSetting);

const testSms = reactive<any>({
  message: '',
  numberTo: '',
});

onMounted(() => {
  fetchData();
});

function clear() {
  formState.tenantId = authStore.getUserInfo().tenantId;
  formState.key = 'sms';
  formState.jsonValue = {
    accessKeyId: '',
    accessKeySecret: '',
    signName: '',
    templateCode: '',
    type: 'ALI_SMS',
  };
  testSms.message = '';
  testSms.numberTo = '';
}

async function fetchData() {
  try {
    loading.value = true;
    clear();
    record.value = await getAdminSettingsApi('sms');
    Object.keys(record.value).forEach((key) => {
      const k = key as keyof AdminSetting;
      formState[k] = record.value[k];
    });
    formState.jsonValue.type = 'ALI_SMS';
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
      content: `${$t('保存短信服务商配置成功！')}`,
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

async function handleOpenTestSmsModal() {
  try {
    await formRef.value?.validate();
    showSmsTestModal.value = true;
  } catch (error: any) {
    message.error({
      content: error.message || `${$t('page.submit.error')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  }
}
async function handleSendTestSms() {
  try {
    const provider = await formRef.value?.validate();
    const data = await testFromRef.value?.validate();
    loading.value = true;
    if (provider && data) {
      await sendTestSms({
        numberTo: `+86${data.numberTo}`,
        message: data.message,
        providerConfiguration: provider.jsonValue,
      });
      message.success({
        content: `${$t('发送测试短信成功！')}`,
        duration: 2,
        key: 'is-form-submitting',
      });
    }
  } catch (error: any) {
    message.error({
      content: error.message || `${$t('page.submit.error')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } finally {
    loading.value = false;
    showSmsTestModal.value = false;
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
      <div class="my-2 text-lg font-semibold">短信服务商配置</div>
      <Form ref="formRef" :model="formState" layout="vertical">
        <Form.Item
          label="短信服务商"
          :name="['jsonValue', 'type']"
          :rules="[{ required: true }]"
        >
          <Select v-model:value="formState.jsonValue.type" :disabled="true">
            <Select.Option value="ALI_SMS">阿里云短信</Select.Option>
            <Select.Option value="AWS_SNS">亚马逊短信</Select.Option>
            <Select.Option value="TWILIO">Twilio</Select.Option>
            <Select.Option value="SMPP">SMPP</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="阿里云访问秘钥ID"
          :name="['jsonValue', 'accessKeyId']"
          :rules="[{ required: true }]"
        >
          <Input v-model:value="formState.jsonValue.accessKeyId" />
        </Form.Item>
        <Form.Item
          label="阿里云访问秘钥"
          :name="['jsonValue', 'accessKeySecret']"
          :rules="[{ required: true }]"
        >
          <InputPassword v-model:value="formState.jsonValue.accessKeySecret" />
        </Form.Item>
        <Form.Item
          label="短信签名"
          :name="['jsonValue', 'signName']"
          :rules="[{ required: true }]"
        >
          <Input v-model:value="formState.jsonValue.signName" />
        </Form.Item>
        <Form.Item
          label="短信模板 Code"
          :name="['jsonValue', 'templateCode']"
          :rules="[{ required: true }]"
        >
          <Input v-model:value="formState.jsonValue.templateCode" />
        </Form.Item>
      </Form>
      <div class="flex gap-4">
        <Button @click="fetchData" class="w-24">
          <IconifyIcon icon="ant-design:reload-outlined" />
          重置
        </Button>
        <Button :loading="loading" @click="handleOpenTestSmsModal">
          <IconifyIcon icon="ant-design:send-outlined" />
          发送测试短信
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
    <Modal
      v-model:open="showSmsTestModal"
      :centered="true"
      title="发送测试短信"
      ok-text="发送测试短信"
      @ok="handleSendTestSms"
    >
      <Form ref="testFromRef" :model="testSms" layout="vertical">
        <Form.Item
          label="手机号码"
          name="numberTo"
          :rules="[
            { required: true },
            { pattern: /^1[3-9]\d{9}$/, message: $t('请填写正确的手机号码') },
          ]"
        >
          <Input v-model:value="testSms.numberTo" />
        </Form.Item>
        <Form.Item
          label="短信内容"
          name="message"
          :rules="[{ required: true }]"
        >
          <Input.TextArea v-model:value="testSms.message" :rows="4" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
