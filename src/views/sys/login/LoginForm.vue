<template>
  <LoginFormTitle v-show="getShow" class="enter-x" />
  <Form class="p-4 enter-x" :model="formData" :rules="getFormRules" ref="formRef" v-show="getShow"
    @keypress.enter="handleLogin">
    <FormItem name="account" class="enter-x">
      <Input size="large" v-model:value="formData.account" :placeholder="t('sys.login.userName')" class="fix-auto-fill" />
    </FormItem>
    <FormItem name="password" class="enter-x">
      <InputPassword size="large" visibilityToggle v-model:value="formData.password"
        :placeholder="t('sys.login.password')" autocomplete="false" />
    </FormItem>
    <FormItem v-if="isValidCodeLogin" name="validCode" class="enter-x valid-code">
      <Input size="large" visibilityToggle v-model:value="formData.validCode" :placeholder="t('sys.login.validCode')">

      <template #suffix>
        <img :src="getValidCodeImg" @click="refreshValidCodeImg" class="cursor-pointer" width="100" />
      </template>
      </Input>
    </FormItem>
    <!-- <FormItem v-if="useCorpModel" name="corpCode" class="enter-x">
      <Select showSearch :options="corpOptions" @change="handleSwitchCorp"
        :placeholder="t('sys.login.corpPlaceholder')" />
    </FormItem> -->

    <ARow class="enter-x">
      <ACol :span="12">
        <FormItem>
          <!-- No logic, you need to deal with it yourself -->
          <Checkbox v-model:checked="rememberMe" size="small">
            {{ t('sys.login.rememberMe') }}
          </Checkbox>
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
      <ACol :md="11" :xs="24" class="!mr-2 !md:my-0 xs:mr-0 md:mx-2">
        <Button block @click="setLoginState(LoginStateEnum.MOBILE)">
          {{ t('sys.login.mobileSignInFormTitle') }}
        </Button>
      </ACol>
      <!-- <ACol :md="8" :xs="24" class="!my-2 !md:my-0 xs:mx-0 md:mx-2">
        <Button block @click="setLoginState(LoginStateEnum.QR_CODE)">
          {{ t('sys.login.qrSignInFormTitle') }}
        </Button>
      </ACol> -->
      <ACol :md="12" :xs="24">
        <Button block @click="setLoginState(LoginStateEnum.REGISTER)">
          {{ t('sys.login.registerButton') }}
        </Button>
      </ACol>
    </ARow>

    <Divider class="enter-x">{{ t('sys.login.otherSignIn') }}</Divider>

    <!-- <div class="flex justify-evenly enter-x" :class="`${prefixCls}-sign-in-way`">
      <Icon icon="ant-design:qq-circle-filled" size="28" @click="handleOauth2" />
      <Icon icon="ant-design:wechat-filled" size="28" @click="handleOauth2" />
      <Icon icon="ant-design:github-filled" size="28" @click="handleOauth2" />
    </div> -->
  </Form>
</template>
<script lang="ts" setup>
import { reactive, ref, toRaw, unref, computed, onMounted } from 'vue';

import { Checkbox, Form, Input, Row, Col, Button, Divider, message } from 'ant-design-vue';
import LoginFormTitle from './LoginFormTitle.vue';

import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';

import { useUserStore } from '/@/store/modules/user';
import { LoginStateEnum, useLoginState, useFormRules, useFormValid } from './useLogin';
// import { useDesign } from '/@/hooks/web/useDesign';
import { useGlobSetting } from '/@/hooks/setting';
import { userInfoApi } from '/@/api/sys/login';
import { PageEnum } from '/@/enums/pageEnum';
// import { onKeyStroke } from '@vueuse/core';
// import { Select } from '/@/components/Form';
// import { corpAdminTreeData } from '/@/api/sys/corpAdmin';

const ACol = Col;
const ARow = Row;
const FormItem = Form.Item;
const InputPassword = Input.Password;
const { t } = useI18n();
const { showMessage, notification } = useMessage();
// const { prefixCls } = useDesign('login');
const { ctxPath } = useGlobSetting();
const userStore = useUserStore();

const { setLoginState, getLoginState } = useLoginState();
const { getFormRules } = useFormRules();

const formRef = ref();
const loading = ref(false);
const rememberMe = ref(false);
const isValidCodeLogin = ref(false);
// const useCorpModel = ref(false);
// const corpOptions = ref<Recordable[]>([]);

const formData = reactive({
  account: '',
  password: '',
  validCode: '',
});

const { validForm } = useFormValid(formRef);

//onKeyStroke('Enter', handleLogin);

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
  const res = await userInfoApi('none');
  if (res) {
    // 如果已经登录，根据业务需要，是否自动跳转到系统首页
    const publicPath = import.meta.env.VITE_PUBLIC_PATH || '';
    window.location.href =
      (publicPath == '' ? publicPath : publicPath.substring(1)) + PageEnum.BASE_HOME;
  }
  // userStore.initPageCache(res);
  refreshValidCodeStatus(res);
  // useCorpModel.value = res.useCorpModel || false;
  // if (useCorpModel.value) {
  //   corpOptions.value = (await corpAdminTreeData({ isShowCode: true })).map((item) => ({
  //     label: item.name,
  //     value: item.id,
  //   }));
  // }
});

// async function handleSwitchCorp(corpCode) {
//   formData.corpCode = corpCode;
// }

async function handleLogin() {
  try {
    const data = await validForm();
    if (!data) return;
    loading.value = true;
    const userInfo = await userStore.login(
      toRaw({
        password: data.password,
        username: data.account,
        validCode: data.validCode,
        rememberMe: unref(rememberMe.value),
      }),
    );
    // refreshValidCodeStatus(userInfo);

    if (userInfo) {
      notification.success({
        message: t('sys.login.loginSuccessTitle'),
        description: `${t('sys.login.loginSuccessDesc')}: ${userInfo.firstName}`,
        duration: 3,
      });
    }
  } catch (error: any) {
    const err: string = error?.toString?.() ?? '';
    if (error?.code === 'ECONNABORTED' && err.indexOf('timeout of') !== -1) {
      showMessage(t('sys.api.apiTimeoutMessage'), 'error');
    } else if (err.indexOf('Network Error') !== -1) {
      showMessage(t('sys.api.networkExceptionMsg'), 'error');
    } else if (error?.code === 'ERR_BAD_RESPONSE') {
      showMessage(t('sys.api.apiRequestFailed'), 'error');
    } else if (error?.errorCode === 10) {
      showMessage(t(error.message), 'error');
    }
    console.log(error);
  } finally {
    loading.value = false;
  }
}
</script>
<style>
.gp {
  padding-bottom: 15px;
  font-size: 16px;
}

.gp,
.gp a {
  color: #d21919;
}
</style>
