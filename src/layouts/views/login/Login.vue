<template>
  <AuthenticationLogin
    :sub-title="'请输入 Thingsboard 账户信息开始进入系统'"
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleLogin"
  >
    <template #third-party-login>
      <TechSupport />
    </template>
  </AuthenticationLogin>
</template>
<script lang="ts" setup>
  import { computed, ref, onMounted, toRaw } from 'vue';
  import { useUserStore } from '/@/store/modules/user';
  import { AuthenticationLogin } from '/@/components/Authentication';
  import { message } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import TechSupport from './techSupport.vue';
  import { FormSchema } from '/@/components/Form';
  import { userInfoApi } from '/@/api/tb/login';

  defineOptions({ name: 'Login' });
  const { showMessage, notification } = useMessage();

  const { t } = useI18n();
  const userStore = useUserStore();
  const loading = ref(false);

  const formSchema = computed((): FormSchema[] => {
    return [
      {
        component: 'Input',
        field: 'username',
        label: t('sys.login.account'),
        componentProps: {
          placeholder: t('sys.login.accountPlaceholder'),
          size: 'large',
        },
        required: true,
      },
      {
        component: 'InputPassword',
        field: 'password',
        label: t('sys.login.password'),
        componentProps: {
          placeholder: t('sys.login.passwordPlaceholder'),
          size: 'large',
        },
        required: true,
      },
    ];
  });

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

  async function handleLogin(data: Recordable) {
    try {
      if (!data) return;
      loading.value = true;
      const res = await userStore.login(
        toRaw({
          password: data.password,
          username: data.username,
        }),
      );

      if (res) {
        notification.success({
          message: t('sys.login.loginSuccessTitle'),
          description: `${t('sys.login.loginSuccessDesc')}: ${res.firstName || res.email}`,
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
      }
      console.log(error);
    } finally {
      loading.value = false;
    }
  }
</script>
