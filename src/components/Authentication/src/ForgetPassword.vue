<template>
  <div>
    <Title>
      <slot name="title"> {{ title || t('authentication.forgetPassword') }} 🤦🏻‍♂️ </slot>
      <template #desc>
        <slot name="subTitle">
          {{ subTitle || t('authentication.forgetPasswordSubtitle') }}
        </slot>
      </template>
    </Title>
    <BasicForm @register="registerForm" />

    <div>
      <Button
        :class="{
          'cursor-wait': loading,
        }"
        aria-label="submit"
        class="mt-2 w-full"
        @click="handleSubmit"
      >
        <slot name="submitButtonText">
          {{ submitButtonText || t('authentication.sendResetLink') }}
        </slot>
      </Button>
      <Button class="mt-4 w-full" variant="outline" @click="goToLogin()">
        {{ t('common.back') }}
      </Button>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { computed, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import Title from './AuthTitle.vue';
  import { Button } from 'ant-design-vue';

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  interface Props {
    formSchema: FormSchema[];
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
    name: 'ForgetPassword',
  });

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    loginPath: '/auth/login',
    submitButtonText: '',
    subTitle: '',
    title: '',
  });

  const emit = defineEmits<{
    submit: [Record<string, any>];
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
        emit('submit', data);
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
