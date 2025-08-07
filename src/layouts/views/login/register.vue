<template>
  <AuthenticationRegister
    sub-title="业务逻辑有待实现"
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
<script lang="ts" setup>
  import { computed, h, ref } from 'vue';
  import { AuthenticationRegister } from '/@/components/Authentication';
  import { FormSchema } from '/@/components/Form';
  import { useI18n } from '/@/hooks/web/useI18n';

  defineOptions({ name: 'Register' });

  const loading = ref(false);
  const { t } = useI18n();

  const formSchema = computed((): FormSchema[] => {
    return [
      {
        component: 'Input',
        field: 'username',
        componentProps: {
          placeholder: t('sys.login.accountPlaceholder'),
          size: 'large',
        },
        label: t('sys.login.account'),
      },
      {
        component: 'InputPassword',
        field: 'password',
        componentProps: {
          placeholder: t('sys.login.passwordPlaceholder'),
          size: 'large',
        },
        label: t('sys.login.password'),
        renderComponentContent() {
          return {
            strengthText: () => t('authentication.passwordStrength'),
          };
        },
      },
      {
        component: 'InputPassword',
        field: 'confirmPassword',
        componentProps: {
          placeholder: t('sys.login.confirmPassword'),
          size: 'large',
        },

        label: t('sys.login.confirmPassword'),
      },
      {
        component: 'Checkbox',
        field: 'agreePolicy',
        renderComponentContent: () => ({
          size: 'large',
          default: () =>
            h('span', [
              h(
                'a',
                {
                  class: 'vben-link ml-1 ',
                  href: '',
                },
                `${t('sys.login.policy')} `,
              ),
            ]),
        }),
      },
    ];
  });

  function handleSubmit(value: Recordable<any>) {
    // eslint-disable-next-line no-console
    console.log('register submit:', value);
  }
</script>
