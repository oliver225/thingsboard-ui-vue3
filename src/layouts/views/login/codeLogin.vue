<template>
  <AuthenticationCodeLogin
    sub-title="业务逻辑有待实现"
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleLogin"
  />
</template>
<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { AuthenticationCodeLogin } from '/@/components/Authentication';
  import { FormSchema } from '/@/components/Form';

  import { useI18n } from '/@/hooks/web/useI18n';

  defineOptions({ name: 'CodeLogin' });

  const loading = ref(false);
  const CODE_LENGTH = 6;
  const { t } = useI18n();

  const formSchema = computed((): FormSchema[] => {
    return [
      {
        component: 'Input',
        componentProps: {
          placeholder: t('sys.login.mobilePlaceholder'),
          size: 'large',
        },
        field: 'phoneNumber',
        label: t('sys.login.mobile'),
        required: true,
      },
      {
        component: 'Input',
        componentProps: {
          codeLength: CODE_LENGTH,
          createText: (countdown: number) => {
            const text = countdown > 0 ? t('authentication.sendText', [countdown]) : $t('authentication.sendCode');
            return text;
          },
          placeholder: t('sys.login.smsCode'),
          size: 'large',
        },
        field: 'code',
        label: t('sys.login.validCode'),
      },
    ];
  });
  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param values 登录表单数据
   */
  async function handleLogin(values: Recordable<any>) {
    // eslint-disable-next-line no-console
    console.log(values);
  }
</script>
