<template>
  <ScrollContainer :style="{ maxHeight: domHeight + 'px' }">
    <Spin :spinning="dataLoading">
      <div class="security-setting">
        <div class="text-lg font-bold my-4">安全策略</div>

        <Form ref="formRef" :model="formState" layout="vertical">
          <CollapseContainer title="基本策略" :canExpan="false" class="border border-solid border-neutral-300 mb-4">
            <div class="px-4">
              <Form.Item label="登录失败之前，最大登录尝试次数" name="maxFailedLoginAttempts">
                <InputNumber v-model:value="formState.maxFailedLoginAttempts" :min="0" style="width: calc(50%)" />
              </Form.Item>
              <Form.Item label="如果用户帐户锁定，请发送通知到电子邮件" name="userLockoutNotificationEmail">
                <Input v-model:value="formState.userLockoutNotificationEmail" />
              </Form.Item>
              <Form.Item
                label="User activation link TTL in hours"
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
                label="Password reset link TTL in hours"
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
              <Form.Item label="Mobile secret key length" name="mobileSecretKeyLength" :rules="[{ required: true }]">
                <InputNumber v-model:value="formState.mobileSecretKeyLength" :min="1" style="width: calc(50%)" />
              </Form.Item>
            </div>
          </CollapseContainer>
          <CollapseContainer title="密码策略" :canExpan="false" class="border border-solid border-neutral-300 mb-4">
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
                  <Form.Item label="最少大写字母位数" :name="['passwordPolicy', 'minimumUppercaseLetters']">
                    <InputNumber
                      v-model:value="formState.passwordPolicy.minimumUppercaseLetters"
                      :min="0"
                      style="width: calc(99%)"
                    />
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item label="最少小写字母位数" :name="['passwordPolicy', 'minimumLowercaseLetters']">
                    <InputNumber
                      v-model:value="formState.passwordPolicy.minimumLowercaseLetters"
                      :min="0"
                      style="width: calc(99%)"
                    />
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item label="最少数字位数" :name="['passwordPolicy', 'minimumDigits']">
                    <InputNumber
                      v-model:value="formState.passwordPolicy.minimumDigits"
                      :min="0"
                      style="width: calc(99%)"
                    />
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item label="最少特殊字符位数" :name="['passwordPolicy', 'minimumSpecialCharacters']">
                    <InputNumber
                      v-model:value="formState.passwordPolicy.minimumSpecialCharacters"
                      :min="0"
                      style="width: calc(99%)"
                    />
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item :name="['passwordPolicy', 'allowWhitespaces']">
                    <Checkbox v-model:checked="formState.passwordPolicy.allowWhitespaces"> 允许包含空格 </Checkbox>
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item :name="['passwordPolicy', 'forceUserToResetPasswordIfNotValid']">
                    <Checkbox v-model:checked="formState.passwordPolicy.forceUserToResetPasswordIfNotValid">
                      如果密码不可用则强制重置密码
                    </Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </CollapseContainer>
        </Form>
        <div class="footer">
          <Space>
            <a-button @click="fetchData">
              <Icon :icon="'ant-design:reload-outlined'" />
              重置
            </a-button>
            <a-button :loading="dataLoading" type="primary" @click="handleSubmit">
              <Icon :icon="'ant-design:check-outlined'" />
              保存
            </a-button>
          </Space>
        </div>
      </div>
    </Spin>
  </ScrollContainer>
</template>
<script lang="ts" setup name="ViewsTbSettingSecuritySetting">
  import { ref, onMounted, reactive } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { CollapseContainer } from '/@/components/Container';
  import { getSecuritySettings, saveSecuritySettings, SecuritySettings } from '/@/api/tb/adminSetting';
  import { Checkbox, Row, Col, Form, Space, Spin, FormInstance, Input, InputNumber } from 'ant-design-vue';
  import { ScrollContainer } from '/@/components/Container/index';
  import { useWindowSizeFn } from '/@/hooks/event/useWindowSizeFn';

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const formRef = ref<FormInstance>();
  const record = ref<SecuritySettings>({} as SecuritySettings);
  const dataLoading = ref(false);
  const domHeight = ref(500);

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

  async function fetchData() {
    try {
      dataLoading.value = true;
      clear();
      const result = await getSecuritySettings();
      record.value = result;
      Object.keys(record.value).forEach((key) => {
        formState[key] = record.value[key];
      });
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
    }
  }

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

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      dataLoading.value = true;
      // console.log('submit', params, data, record);
      const res = await saveSecuritySettings({ ...record.value, ...data });
      fetchData();
      showMessage('保存安全策略成功！');
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
    }
  }

  useWindowSizeFn(computedDomHeight, 280, { immediate: true });

  function computedDomHeight() {
    domHeight.value = document.documentElement.clientHeight - 165;
  }
</script>
<style lang="less">
  .security-setting {
    padding: 6px 46px 24px 24px;

    .footer {
      margin-top: 42px;
    }
  }
</style>
