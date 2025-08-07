<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useUserStore } from '/@/store/modules/user';
  import { AuthenticationLogin } from '/@/components/Authentication';
  import { useI18n } from '/@/hooks/web/useI18n';
  import TechSupport from './techSupport.vue';
  import { FormSchema } from '/@/components/Form';

  defineOptions({ name: 'Login' });

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
</script>

<template>
  <AuthenticationLogin
    :sub-title="'请输入 Thingsboard 账户信息开始进入系统'"
    :form-schema="formSchema"
    :loading="loading"
    @submit="userStore.login"
  >
    <template #third-party-login>
      <TechSupport />
    </template>
  </AuthenticationLogin>
</template>
