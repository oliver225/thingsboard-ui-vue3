<template>
  <div>
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="text-foreground mb-3 text-3xl font-bold leading-9 tracking-tight lg:text-4xl">
        {{ t('sys.login.createPassword') }} 🚀
      </h2>

      <p class="text-secondary lg:text-md text-sm">
        {{ t('创建密码 激活账户') }}
      </p>
    </div>
    <Form class="enter-x p-4" :model="formData" ref="formRef" :rules="formRules">
      <FormItem name="activateToken" class="enter-x">
        <Input :hidden="true" size="large" v-model:value="formData.activateToken" />
      </FormItem>
      <FormItem name="password" class="enter-x">
        <StrengthMeter size="large" v-model:value="formData.password" :placeholder="t('sys.login.password')" />
      </FormItem>
      <FormItem name="confirmPassword" class="enter-x">
        <InputPassword
          size="large"
          visibilityToggle
          v-model:value="formData.confirmPassword"
          :placeholder="t('sys.login.confirmPassword')"
          autocomplete="off"
        />
      </FormItem>
    </Form>
    <Button type="primary" class="enter-x" size="large" block @click="handleCreatePassword" :loading="loading">
      {{ t('sys.login.createPassword') }}
    </Button>
    <div class="mt-4 text-center text-sm">
      {{ $t('sys.login.alreadyHaveAccount') }}
      <Button type="link" @click="goToLogin()">
        {{ $t('sys.login.goToLogin') }}
      </Button>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue';
  import { Form, Input, Button } from 'ant-design-vue';
  import { router } from '/@/router';
  import { useUserStore } from '/@/store/modules/user';
  import { StrengthMeter } from '/@/components/StrengthMeter';

  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { activateUser } from '/@/api/tb/auth';
  import type { Rule, RuleObject } from 'ant-design-vue/es/form';

  const { t } = useI18n();
  const { showMessage, createConfirm, notification } = useMessage();
  const userStore = useUserStore();

  defineOptions({
    name: 'CreatePasswordPage',
  });

  const FormItem = Form.Item;
  const InputPassword = Input.Password;

  const formRef = ref();

  const loading = ref(false);

  const formData = reactive({
    activateToken: '',
    password: '',
    confirmPassword: '',
  });

  function validateConfirmPassword(_: RuleObject, value: string) {
    if (!value) {
      return Promise.reject(t('sys.login.passwordPlaceholder'));
    }
    if (value !== formData.password) {
      return Promise.reject(t('sys.login.diffPwd'));
    }
    return Promise.resolve();
  }

  const formRules: Record<string, Rule[]> = {
    password: [
      { required: true, message: t('sys.login.passwordPlaceholder'), trigger: 'blur' },
      { min: 6, trigger: 'blur' },
    ],
    confirmPassword: [{ validator: validateConfirmPassword, trigger: 'change' }],
  };

  onMounted(() => {
    const routerQuery = router.currentRoute.value.query;
    if ('activateToken' in routerQuery) {
      formData.activateToken = routerQuery.activateToken as string;
    } else {
      createConfirm({
        maskClosable: false,
        iconType: 'error',
        title: '页面错误',
        content: '当前激活连接错误，请重新获取！',
        okText: '去登录',
        maskStyle: { backdropFilter: 'blur(50px)' },
        onOk: () => {
          goToLogin();
        },
        onCancel: () => {
          goToLogin();
        },
      });
    }
  });

  async function handleCreatePassword() {
    const data = await formRef.value.validate();
    if (data) {
      loading.value = true;
      try {
        const jwtPawir = await activateUser({ ...data, activateToken: formData.activateToken });
        showMessage(`创建密码成功！`, 'success');
        userStore.setToken(jwtPawir);
        userStore.setSessionTimeout(false);
        const userInfo = await userStore.getUserInfoAction();
        if (userInfo) {
          await userStore.afterLoginAction(userInfo, true);
          notification.success({
            message: t('sys.login.loginSuccessTitle'),
            description: `${t('创建密码成功，开始使用吧')}: ${userInfo.firstName || userInfo.email}`,
            duration: 3,
          });
        }
      } catch (error: any) {
        if (error && error.errorFields) {
          showMessage(t('common.validateError'));
        }
        console.log('error', error);
      } finally {
        loading.value = false;
      }
    }
  }

  function goToLogin() {
    router.push({ path: '/auth/login' });
  }
</script>
