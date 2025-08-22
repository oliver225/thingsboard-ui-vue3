<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { SecuritySettings } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Loading } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
} from 'ant-design-vue';

import { getSecuritySettingsApi, saveSecuritySettingsApi } from '#/api';
import { CollapseContainer } from '#/components/Container';

defineOptions({
  name: 'SecuritySetting',
});

const formRef = ref<FormInstance>();

const record = ref<SecuritySettings>({} as SecuritySettings);

const loading = ref(false);

const formState = reactive<SecuritySettings>({
  maxFailedLoginAttempts: undefined,
  userLockoutNotificationEmail: '',
  userActivationTokenTtl: 24,
  passwordResetTokenTtl: 24,
  mobileSecretKeyLength: 64,
  passwordPolicy: {
    allowWhitespaces: true,
    forceUserToResetPasswordIfNotValid: false,
    maximumLength: 72,
    minimumLength: 6,
    minimumDigits: 0,
    minimumLowercaseLetters: 0,
    minimumSpecialCharacters: 0,
    minimumUppercaseLetters: 0,
    passwordExpirationPeriodDays: 0,
    passwordReuseFrequencyDays: 0,
  },
} as SecuritySettings);

onMounted(() => {
  fetchData();
});

function clear() {
  formState.maxFailedLoginAttempts = undefined;
  formState.userLockoutNotificationEmail = '';
  formState.userActivationTokenTtl = 24;
  formState.passwordResetTokenTtl = 24;
  formState.mobileSecretKeyLength = 64;
  formState.passwordPolicy = {
    allowWhitespaces: true,
    forceUserToResetPasswordIfNotValid: false,
    maximumLength: 72,
    minimumLength: 6,
    minimumDigits: 0,
    minimumLowercaseLetters: 0,
    minimumSpecialCharacters: 0,
    minimumUppercaseLetters: 0,
    passwordExpirationPeriodDays: 0,
    passwordReuseFrequencyDays: 0,
  };
}

async function fetchData() {
  try {
    loading.value = true;
    clear();
    record.value = await getSecuritySettingsApi();
    Object.keys(record.value).forEach((key) => {
      const k = key as keyof SecuritySettings;
      formState[k] = record.value[k];
    });
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
    await saveSecuritySettingsApi({ ...record.value, ...data });
    fetchData();
    message.success({
      content: `${$t('保存安全设置成功！')}`,
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
      <div class="my-2 text-lg font-semibold">安全设置</div>
      <Form ref="formRef" :model="formState" layout="vertical">
        <CollapseContainer
          title="基本策略"
          :can-expan="false"
          class="mb-4 border border-solid border-[hsl(var(--border))]"
        >
          <div class="px-4">
            <Form.Item
              label="登录失败之前，最大登录尝试次数"
              name="maxFailedLoginAttempts"
            >
              <InputNumber
                v-model:value="formState.maxFailedLoginAttempts"
                :min="0"
                style="width: calc(50%)"
              />
            </Form.Item>
            <Form.Item
              label="如果用户帐户锁定，请发送通知到电子邮件"
              name="userLockoutNotificationEmail"
            >
              <Input v-model:value="formState.userLockoutNotificationEmail" />
            </Form.Item>
            <Form.Item
              label="用户激活链接在1小时内"
              name="userActivationTokenTtl"
              :rules="[{ required: true }]"
            >
              <InputNumber
                v-model:value="formState.userActivationTokenTtl"
                :min="1"
                :max="24"
                style="width: calc(50%)"
              />
            </Form.Item>
            <Form.Item
              label="密码重置链接1小时内"
              name="passwordResetTokenTtl"
              :rules="[{ required: true }]"
            >
              <InputNumber
                v-model:value="formState.passwordResetTokenTtl"
                :min="1"
                :max="24"
                style="width: calc(50%)"
              />
            </Form.Item>
            <Form.Item
              label="移动端密钥长度"
              name="mobileSecretKeyLength"
              :rules="[{ required: true }]"
            >
              <InputNumber
                v-model:value="formState.mobileSecretKeyLength"
                :min="1"
                style="width: calc(50%)"
              />
            </Form.Item>
          </div>
        </CollapseContainer>
        <CollapseContainer
          title="密码策略"
          :can-expan="false"
          class="mb-4 border border-solid border-[hsl(var(--border))]"
        >
          <div class="px-4">
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item
                  label="最小密码长度"
                  :name="['passwordPolicy', 'minimumLength']"
                  :rules="[{ required: true }]"
                >
                  <InputNumber
                    v-model:value="formState.passwordPolicy.minimumLength"
                    :min="1"
                    style="width: calc(99%)"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最大密码长度"
                  :name="['passwordPolicy', 'maximumLength']"
                  :rules="[{ required: true }]"
                >
                  <InputNumber
                    v-model:value="formState.passwordPolicy.maximumLength"
                    :min="1"
                    style="width: calc(99%)"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最少大写字母位数"
                  :name="['passwordPolicy', 'minimumUppercaseLetters']"
                >
                  <InputNumber
                    v-model:value="
                      formState.passwordPolicy.minimumUppercaseLetters
                    "
                    :min="0"
                    style="width: calc(99%)"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最少小写字母位数"
                  :name="['passwordPolicy', 'minimumLowercaseLetters']"
                >
                  <InputNumber
                    v-model:value="
                      formState.passwordPolicy.minimumLowercaseLetters
                    "
                    :min="0"
                    style="width: calc(99%)"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最少数字位数"
                  :name="['passwordPolicy', 'minimumDigits']"
                >
                  <InputNumber
                    v-model:value="formState.passwordPolicy.minimumDigits"
                    :min="0"
                    style="width: calc(99%)"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="最少特殊字符位数"
                  :name="['passwordPolicy', 'minimumSpecialCharacters']"
                >
                  <InputNumber
                    v-model:value="
                      formState.passwordPolicy.minimumSpecialCharacters
                    "
                    :min="0"
                    style="width: calc(99%)"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item :name="['passwordPolicy', 'allowWhitespaces']">
                  <Checkbox
                    v-model:checked="formState.passwordPolicy.allowWhitespaces"
                  >
                    允许包含空格
                  </Checkbox>
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  :name="[
                    'passwordPolicy',
                    'forceUserToResetPasswordIfNotValid',
                  ]"
                >
                  <Checkbox
                    v-model:checked="
                      formState.passwordPolicy
                        .forceUserToResetPasswordIfNotValid
                    "
                  >
                    如果密码不可用则强制重置密码
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>
          </div>
        </CollapseContainer>
      </Form>
      <div class="flex gap-4">
        <Button @click="fetchData" class="w-24">
          <IconifyIcon icon="ant-design:reload-outlined" />
          重置
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
