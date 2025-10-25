<template>
  <AuthenticationForgetPassword :form-schema="formSchema" :loading="loading" @submit="handleSubmit" />
</template>

<script lang="ts" setup>
  import { computed, ref, toRaw } from 'vue';
  import { FormSchema } from '/@/components/Form';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { AuthenticationForgetPassword } from '/@/components/Authentication';
  import { resetPasswordByEmail } from '/@/api/tb/noauth';
  const { t } = useI18n();
  const { showMessage, notification } = useMessage();

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
            { label: t('sys.login.passwordRetrieveByEmail'), value: 'email' },
            { label: t('sys.login.passwordRetrieveByMobile'), value: 'mobile' },
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
        rules: [{ required: true }, { type: 'email', message: t('sys.login.emailFormatError') }],
      },
    ];
  });

  async function handleSubmit(data: Recordable<any>) {
    try {
      if (!data) return;
      loading.value = true;
      const res = await resetPasswordByEmail(toRaw(data.email));
      notification.success({
        message: t('sys.login.passwordResetLinkSent'),
        duration: 0,
      });
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
