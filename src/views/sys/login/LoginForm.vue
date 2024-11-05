<template>
  <LoginFormTitle v-show="getShow" class="enter-x" />
  <Form
    class="enter-x p-4"
    :model="formData"
    :rules="getFormRules"
    ref="formRef"
    v-show="getShow"
    @keypress.enter="handleLogin"
  >
    <FormItem name="account" class="enter-x">
      <Input
        size="large"
        v-model:value="formData.account"
        :placeholder="t('sys.login.userName')"
        class="fix-auto-fill"
      />
    </FormItem>
    <FormItem name="password" class="enter-x">
      <InputPassword
        size="large"
        visibilityToggle
        v-model:value="formData.password"
        :placeholder="t('sys.login.password')"
        autocomplete="false"
      />
    </FormItem>
    <FormItem v-if="isValidCodeLogin" name="validCode" class="enter-x valid-code">
      <Input
        size="large"
        visibilityToggle
        v-model:value="formData.validCode"
        :placeholder="t('sys.login.validCode')"
      >
        <!-- addonAfter suffix -->
        <template #suffix>
          <img
            :src="getValidCodeImg"
            @click="refreshValidCodeImg"
            class="cursor-pointer"
            width="100"
          />
        </template>
      </Input>
    </FormItem>

    <ARow class="enter-x">
      <ACol :span="12">
        <FormItem>
          <!-- No logic, you need to deal with it yourself -->
          <!-- <Checkbox v-model:checked="rememberMe" size="small">
            {{ t('sys.login.rememberMe') }}
          </Checkbox> -->
        </FormItem>
      </ACol>
      <ACol :span="12">
        <FormItem :style="{ 'text-align': 'right' }">
          <!-- No logic, you need to deal with it yourself -->
          <Button type="link" size="small" @click="setLoginState(LoginStateEnum.RESET_PASSWORD)">
            {{ t('sys.login.forgetPassword') }}
          </Button>
        </FormItem>
      </ACol>
    </ARow>

    <FormItem class="enter-x">
      <Button type="primary" size="large" block @click="handleLogin" :loading="loading">
        {{ t('sys.login.loginButton') }}
      </Button>
      <!-- <Button size="large" class="mt-4 enter-x" block @click="handleRegister">
        {{ t('sys.login.registerButton') }}
      </Button> -->
    </FormItem>
    <ARow class="enter-x md:pl-3">
      <ACol :md="7" :xs="24">
        <Button block @click="setLoginState(LoginStateEnum.MOBILE)">
          {{ t('sys.login.mobileSignInFormTitle') }}
        </Button>
      </ACol>
      <ACol :md="8" :xs="24" class="xs:mx-0 !my-2 md:mx-2 !md:my-0">
        <Button block @click="setLoginState(LoginStateEnum.QR_CODE)">
          {{ t('sys.login.qrSignInFormTitle') }}
        </Button>
      </ACol>
      <ACol :md="7" :xs="24">
        <Button block @click="setLoginState(LoginStateEnum.REGISTER)">
          {{ t('sys.login.registerButton') }}
        </Button>
      </ACol>
    </ARow>

    <Divider class="enter-x">{{ t('技术支持') }}</Divider>

    <div class="enter-x flex justify-evenly" :class="`${prefixCls}-sign-in-way`">
      <Icon icon="gitee.svg" size="24" @click="handle2Gitee" />
      <Icon icon="ant-design:wechat-filled" size="28" @click="handle2Wechat" />
      <Icon icon="ant-design:github-filled" size="28" @click="handle2Github" />
    </div>
  </Form>
</template>
<script lang="ts" setup>
  import { reactive, ref, toRaw, unref, computed, onMounted } from 'vue';

  import { Checkbox, Form, Input, Row, Col, Button, Divider, message } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import LoginFormTitle from './LoginFormTitle.vue';

  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';

  import { useUserStore } from '/@/store/modules/user';
  import { LoginStateEnum, useLoginState, useFormRules, useFormValid } from './useLogin';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useGlobSetting } from '/@/hooks/setting';
  import { userInfoApi } from '/@/api/tb/login';
  import { openWindow } from '/@/utils';
  import weixinUrl from '/@/assets/images/weixin.jpg';
  import { onKeyStroke } from '@vueuse/core';
import { type } from 'os';

  const ACol = Col;
  const ARow = Row;
  const FormItem = Form.Item;
  const InputPassword = Input.Password;
  const { t } = useI18n();
  const { showMessage, showMessageModal, notification } = useMessage();
  const { prefixCls } = useDesign('login');
  const { ctxPath } = useGlobSetting();
  const userStore = useUserStore();

  const { setLoginState, getLoginState } = useLoginState();
  const { getFormRules } = useFormRules();

  const formRef = ref();
  const loading = ref(false);
  // const rememberMe = ref(false);
  const isValidCodeLogin = ref(false);

  const formData = reactive({
    account: 'system',
    password: '',
    validCode: '',
  });

  const { validForm } = useFormValid(formRef);

  onKeyStroke('Enter', handleLogin);

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN);

  const getValidCodeImg = ref('');

  function refreshValidCodeImg() {
    getValidCodeImg.value =
      ctxPath + '/validCode' + '?__sid=' + userStore.getToken + '&t=' + new Date().getTime();
  }

  // is show jee site valid data.
  function refreshValidCodeStatus(res: Recordable) {
    isValidCodeLogin.value = res.isValidCodeLogin || false;
    if (isValidCodeLogin.value) {
      refreshValidCodeImg();
    }
  }

  onMounted(async () => {
    setTimeout(() => message.destroy());
    try {
      const res = await userInfoApi('none');
      if (res) {
        // 如果已经登录，根据业务需要，是否自动跳转到系统首页
        await userStore.afterLoginAction(res, true);
        return;
      }
      userStore.initPageCache(res);
      refreshValidCodeStatus(res);
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
    }
  });

  async function handleLogin() {
    try {
      const data = await validForm();
      if (!data) return;
      loading.value = true;
      const res = await userStore.login(
        toRaw({
          password: data.password,
          username: data.account,
          validCode: data.validCode,
          // rememberMe: unref(rememberMe.value),
        }),
      );
      refreshValidCodeStatus(res);
      if (res) {
        notification.success({
          message: t('sys.login.loginSuccessTitle'),
          description: `${t('sys.login.loginSuccessDesc')}: ${res.firstName}`,
          duration: 1,
        });
      }
    } catch (error: any) {
      const err: string = error?.toString?.() ?? '';
      if (error?.code === 'ECONNABORTED' && err.indexOf('timeout of') !== -1) {
        showMessage(t('sys.api.apiTimeoutMessage'));
      } else if (err.indexOf('Network Error') !== -1) {
        showMessage(t('sys.api.networkExceptionMsg'));
      } else if (error?.code === 'ERR_BAD_RESPONSE') {
        showMessage(t('sys.api.apiRequestFailed'));
      }else if(error?.response?.data?.message){
        showMessage(t(error?.response?.data?.message),'error');
      }
      console.log(error);
    } finally {
      loading.value = false;
    }
  }

  function handle2Gitee() {
  openWindow("https://gitee.com/oliver225/thingsboard-ui-vue3")

}
function handle2Github() {
  openWindow("https://github.com/oliver225/thingsboard-ui-vue3")
}

function handle2Wechat() {
  showMessageModal(
    {
      icon: null,
      content: `<img style="width:100%" src='` + weixinUrl + `'/>`,
      closable: true,
      footer: null,
    }
  )
}
</script>
<style>
</style>
