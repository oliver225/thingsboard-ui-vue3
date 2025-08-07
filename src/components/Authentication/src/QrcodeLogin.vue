<template>
  <div>
    <Title>
      <slot name="title"> {{ title || t('sys.login.welcomeBack') }} 📱 </slot>
      <template #desc>
        <span class="text-secondary">
          <slot name="subTitle">
            {{ subTitle || t('sys.login.qrcodeSubtitle') }}
          </slot>
        </span>
      </template>
    </Title>

    <div class="flex-col-center mt-6">
      <QrCode :value="text" class="w-1/2" />
      <!-- <img :src="qrcode" alt="qrcode" class="w-1/2" /> -->
      <p class="text-secondary mt-4 text-sm">
        <slot name="description">
          {{ description || t('sys.login.scanSign') }}
        </slot>
      </p>
    </div>

    <Button class="mt-4 w-full" size="large" @click="goToLogin()">
      {{ t('common.back') }}
    </Button>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { QrCode } from '/@/components/Qrcode';
  import { Button } from 'ant-design-vue';
  // import { useQRCode } from '@vueuse/integrations/useQRCode';

  import Title from './AuthTitle.vue';

  const { t } = useI18n('tb');

  interface Props {
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
    /**
     * @zh_CN 描述
     */
    description?: string;
  }

  defineOptions({
    name: 'AuthenticationQrCodeLogin',
  });

  const props = withDefaults(defineProps<Props>(), {
    description: '',
    loading: false,
    loginPath: '/auth/login',
    submitButtonText: '',
    subTitle: '',
    title: '',
  });

  const router = useRouter();

  const text = ref('https://vben.vvbin.cn');

  // const qrcode = useQRCode(text, {
  //   errorCorrectionLevel: 'H',
  //   margin: 4,
  // });

  function goToLogin() {
    router.push(props.loginPath);
  }
</script>
