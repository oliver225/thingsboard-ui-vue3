<script lang="ts" setup>
  import { computed, markRaw, ref } from 'vue';
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
        componentProps: {
          placeholder: t('authentication.usernameTip'),
          size: 'large',
        },

        field: 'username',
        label: t('authentication.username'),
        required: true,
      },
      {
        component: 'InputPassword',
        componentProps: {
          placeholder: t('authentication.password'),
          size: 'large',
        },
        field: 'password',
        label: t('authentication.password'),
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
