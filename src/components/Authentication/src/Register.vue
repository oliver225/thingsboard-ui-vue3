<template>
  <div>
    <Title>
      <slot name="title"> {{ title || $t('authentication.createAnAccount') }} 🚀 </slot>
      <template #desc>
        <slot name="subTitle">
          {{ subTitle || $t('authentication.signUpSubtitle') }}
        </slot>
      </template>
    </Title>
    <BasicForm @register="registerForm" />

    <Button
      :class="{
        'cursor-wait': loading,
      }"
      :loading="loading"
      aria-label="register"
      class="mt-2 w-full"
      @click="handleSubmit"
    >
      <slot name="submitButtonText">
        {{ submitButtonText || $t('authentication.signUp') }}
      </slot>
    </Button>
    <div class="mt-4 text-center text-sm">
      {{ $t('authentication.alreadyHaveAccount') }}
      <span class="vben-link text-sm font-normal" @click="goToLogin()">
        {{ $t('authentication.goToLogin') }}
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { Button } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';

  import Title from './AuthTitle.vue';

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  interface Props {
    formSchema?: FormSchema[];
    /**
     * @zh_CN 是否处于加载处理状态
     */
    loading?: boolean;
    /**
     * @zh_CN 登录路径
     */
    loginPath?: string;
    /**
     * @zh_CN 标题
     */
    title?: string;
    /**
     * @zh_CN 描述
     */
    subTitle?: string;
    /**
     * @zh_CN 按钮文本
     */
    submitButtonText?: string;
  }

  defineOptions({
    name: 'RegisterForm',
  });

  const props = withDefaults(defineProps<Props>(), {
    formSchema: () => [],
    loading: false,
    loginPath: '/auth/login',
    submitButtonText: '',
    subTitle: '',
    title: '',
  });

  const emit = defineEmits<{
    submit: [Recordable<any>];
  }>();

  const [registerForm, formApi] = useForm(
    reactive({
      commonConfig: {
        hideLabel: true,
        hideRequiredMark: true,
      },
      schemas: computed(() => props.formSchema),
      showDefaultActions: false,
    }),
  );

  const router = useRouter();

  async function handleSubmit() {
    try {
      const data = await formApi.validate();
      if (data) {
        emit('submit', data as { password: string; username: string });
      }
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    }
  }

  function goToLogin() {
    router.push(props.loginPath);
  }

  defineExpose({
    getFormApi: () => formApi,
  });
</script>
