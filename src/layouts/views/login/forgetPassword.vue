<template>
  <AuthenticationForgetPassword :form-schema="formSchema" :loading="loading" @submit="handleSubmit" />
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { FormSchema } from '/@/components/Form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { AuthenticationForgetPassword } from '/@/components/Authentication';
  const { t } = useI18n();

  defineOptions({ name: 'ForgetPassword' });

  const loading = ref(false);

  const formSchema = computed((): FormSchema[] => {
    return [
      {
        component: 'Select',
        field: 'validType',
        defaultValue: 'email',
        label: t('sys.login.account'),
        componentProps: {
          options: [
            { label: '使用电子邮箱找回您的密码', value: 'email' },
            { label: '使用手机号码找回您的密码', value: 'mobile' },
          ],
          disabled: true,
          size: 'large',
        },
      },
      {
        component: 'Input',
        field: 'email',
        label: t('sys.login.email'),
        componentProps: {
          placeholder: t('sys.login.emailPlaceholder'),
          size: 'large',
        },
        rules: [{ required: true }, { type: 'email', message: '请输入正确的邮箱地址' }],
      },
    ];
  });

  function handleSubmit(value: Recordable<any>) {
    console.log('reset email:', value);
  }
</script>
