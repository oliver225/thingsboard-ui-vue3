<template>
  <div>
    <Title>
      <slot name="title"> {{ title || t('authentication.welcomeBack') }} 📲 </slot>
      <template #desc>
        <span class="text-muted-foreground">
          <slot name="subTitle">
            {{ subTitle || t('authentication.codeSubtitle') }}
          </slot>
        </span>
      </template>
    </Title>
    <BasicForm @register="registerForm" />
    <Button
      :class="{
        'cursor-wait': loading,
      }"
      :loading="loading"
      class="w-full"
      @click="handleSubmit"
    >
      <slot name="submitButtonText">
        {{ submitButtonText || t('common.login') }}
      </slot>
    </Button>
    <Button class="mt-4 w-full" variant="outline" @click="goToLogin()">
      {{ t('common.back') }}
    </Button>
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
    name: 'AuthenticationCodeLogin',
  });

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    loginPath: '/auth/login',
    submitButtonText: '',
    subTitle: '',
    title: '',
  });

  const emit = defineEmits<{
    submit: [Recordable<any>];
  }>();

  const router = useRouter();

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
