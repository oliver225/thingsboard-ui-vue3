<template>
  <div @keydown.enter.prevent="handleSubmit">
    <slot name="title">
      <Title>
        <slot name="title">
          {{ title || `${t('sys.login.welcomeBack')} 👋🏻` }}
        </slot>
        <template #desc>
          <span class="text-secondary">
            <slot name="subTitle">
              {{ subTitle || t('sys.login.loginSubtitle') }}
            </slot>
          </span>
        </template>
      </Title>
    </slot>

    <BasicForm @register="registerForm" />

    <div v-if="showRememberMe || showForgetPassword" class="mb-6 flex justify-between">
      <div class="flex-center">
        <Checkbox v-if="showRememberMe" v-model:checked="rememberMe" name="rememberMe">
          {{ t('sys.login.rememberMe') }}
        </Checkbox>
      </div>

      <Button type="link" v-if="showForgetPassword" @click="handleGo(forgetPasswordPath)">
        {{ t('sys.login.forgetPassword') }}
      </Button>
    </div>
    <Button type="primary" size="large" :loading="loading" class="w-full" @click="handleSubmit">
      {{ submitButtonText || t('sys.login.loginButton') }}
    </Button>

    <div v-if="showCodeLogin || showQrcodeLogin" class="mb-2 mt-4 flex items-center justify-between">
      <Button v-if="showCodeLogin" class="w-1/2" variant="outline" @click="handleGo(codeLoginPath)">
        {{ t('sys.login.mobileSignInFormTitle') }}
      </Button>
      <Button v-if="showQrcodeLogin" class="ml-4 w-1/2" variant="outline" @click="handleGo(qrCodeLoginPath)">
        {{ t('sys.login.qrSignInFormTitle') }}
      </Button>
    </div>

    <!-- 第三方登录 -->
    <slot name="third-party-login">
      <ThirdPartyLogin v-if="showThirdPartyLogin" />
    </slot>

    <slot name="to-register">
      <div v-if="showRegister" class="mt-3 text-center text-sm">
        <span> {{ t('sys.login.accountTip') }} </span>
        <Button type="link" @click="handleGo(registerPath)">
          {{ t('sys.login.registerButton') }}
        </Button>
      </div>
    </slot>
  </div>
</template>
<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { router } from '/@/router';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import Title from './AuthTitle.vue';
  import ThirdPartyLogin from './ThirdPartyLogin.vue';
  import { Button, Checkbox } from 'ant-design-vue';

  const { t } = useI18n();
  const { showMessage, notification } = useMessage();

  interface Props {
    formSchema?: FormSchema[];
    /**
     * @zh_CN 验证码登录路径
     */
    codeLoginPath?: string;
    /**
     * @zh_CN 忘记密码路径
     */
    forgetPasswordPath?: string;

    /**
     * @zh_CN 是否处于加载处理状态
     */
    loading?: boolean;

    /**
     * @zh_CN 二维码登录路径
     */
    qrCodeLoginPath?: string;

    /**
     * @zh_CN 注册路径
     */
    registerPath?: string;

    /**
     * @zh_CN 是否显示验证码登录
     */
    showCodeLogin?: boolean;
    /**
     * @zh_CN 是否显示忘记密码
     */
    showForgetPassword?: boolean;

    /**
     * @zh_CN 是否显示二维码登录
     */
    showQrcodeLogin?: boolean;

    /**
     * @zh_CN 是否显示注册按钮
     */
    showRegister?: boolean;

    /**
     * @zh_CN 是否显示记住账号
     */
    showRememberMe?: boolean;

    /**
     * @zh_CN 是否显示第三方登录
     */
    showThirdPartyLogin?: boolean;

    /**
     * @zh_CN 登录框子标题
     */
    subTitle?: string;

    /**
     * @zh_CN 登录框标题
     */
    title?: string;
    /**
     * @zh_CN 提交按钮文本
     */
    submitButtonText?: string;
  }

  defineOptions({
    name: 'AuthenticationLogin',
  });

  const props = withDefaults(defineProps<Props>(), {
    codeLoginPath: '/auth/code-login',
    forgetPasswordPath: '/auth/forget-password',
    formSchema: () => [],
    loading: false,
    qrCodeLoginPath: '/auth/qrcode-login',
    registerPath: '/auth/register',
    showCodeLogin: true,
    showForgetPassword: true,
    showQrcodeLogin: true,
    showRegister: true,
    showRememberMe: true,
    showThirdPartyLogin: true,
    submitButtonText: '',
    subTitle: '',
    title: '',
  });

  const emit = defineEmits<{
    submit: [Recordable<any>];
  }>();

  const [registerForm, formApi] = useForm(
    reactive({
      labelWidth: 1,
      schemas: computed(() => props.formSchema),
      baseColProps: { lg: 24, md: 24 },

      showActionButtonGroup: false,
    }),
  );

  const REMEMBER_ME_KEY = `REMEMBER_ME_USERNAME_${location.hostname}`;

  const localUsername = localStorage.getItem(REMEMBER_ME_KEY) || '';

  const rememberMe = ref(!!localUsername);

  async function handleSubmit() {
    try {
      const data = await formApi.validate();
      if (data) {
        localStorage.setItem(REMEMBER_ME_KEY, rememberMe.value ? data?.username : '');
        emit('submit', data);
      }
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    }
  }

  function handleGo(path: string) {
    router.push(path);
  }

  onMounted(() => {
    if (localUsername) {
      formApi.setFieldsValue({ username: localUsername });
    }
  });

  defineExpose({
    getFormApi: () => formApi,
  });
</script>
