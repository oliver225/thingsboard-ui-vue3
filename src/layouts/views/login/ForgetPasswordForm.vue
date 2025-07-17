<template>
  <template v-if="getShow">
    <LoginFormTitle class="enter-x mb-8" />
    <Form class="enter-x p-4" :model="formData" :rules="getFormRules" ref="formRef">
      <FormItem name="validType" class="enter-x">
        <Select
          disabled
          :showSearch="false"
          :options="[
            { label: '使用电子邮箱找回您的密码', value: 'email' },
            { label: '使用手机号码找回您的密码', value: 'mobile' },
          ]"
          v-model:value="formData.validType"
          size="large"
        />
      </FormItem>
      <FormItem name="loginCode" class="enter-x">
        <Input size="large" v-model:value="formData.email" :placeholder="t('sys.login.email')" />
      </FormItem>
      <FormItem class="enter-x">
        <div class="flex justify-between space-x-4 mt-8">
          <Button type="primary" size="large" block @click="handleResetPwd" :loading="loading">
            {{ t('sys.login.requestResetPassword') }}
          </Button>
          <Button size="large" block @click="handleBackLogin">
            {{ t('sys.login.backSignIn') }}
          </Button>
        </div>
      </FormItem>
    </Form>
  </template>
</template>
<script lang="ts" setup>
  import { reactive, ref, computed, unref } from 'vue';
  import LoginFormTitle from './LoginFormTitle.vue';
  import { Form, Input, Button } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useLoginState, useFormRules, LoginStateEnum, useFormValid } from './useLogin';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Select } from '/@/components/Form';

  const FormItem = Form.Item;
  const { t } = useI18n();
  const { handleBackLogin, getLoginState } = useLoginState();
  const { showMessage, showMessageModal } = useMessage();

  const formRef = ref();
  const loading = ref(false);

  const formData = reactive({
    validType: '',
    email: '',
  });

  const { getFormRules } = useFormRules(formData);
  const { validForm } = useFormValid(formRef);

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.RESET_PASSWORD);

  async function handleResetPwd() {
    try {
      const data = await validForm();
      if (!data) return;
      loading.value = true;
      let res: Recordable;
      if (data.validType == 'email') {
        res = {};
      } else {
        res = {};
      }
      if (res.result == 'true') {
        showMessageModal({ content: res.message });
        handleBackLogin();
      } else {
        showMessage(res.message);
      }
    } catch (error: any) {
      const err: string = error?.toString?.() ?? '';
      if (error?.code === 'ECONNABORTED' && err.indexOf('timeout of') !== -1) {
        showMessage(t('sys.api.apiTimeoutMessage'));
      } else if (err.indexOf('Network Error') !== -1) {
        showMessage(t('sys.api.networkExceptionMsg'));
      } else if (error?.code === 'ERR_BAD_RESPONSE') {
        showMessage(t('sys.api.apiRequestFailed'));
      }
      console.log(error);
    } finally {
      loading.value = false;
    }
  }
</script>
