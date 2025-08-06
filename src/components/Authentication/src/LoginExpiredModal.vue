<template>
  <div>
    <BasicModal
      @register="registerModal"
      :closable="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :footer="false"
      :fullscreen-button="false"
      :header="false"
      :z-index="getZIndex"
      class="border-none px-10 py-6 text-center shadow-xl sm:w-[600px] sm:rounded-2xl md:h-[unset]"
    >
      <Avatar :src="avatar" class="mx-auto mb-6 size-20" />
      <Slot
        :show-forget-password="false"
        :show-register="false"
        :show-remember-me="false"
        :sub-title="$t('authentication.loginAgainSubTitle')"
        :title="$t('authentication.loginAgainTitle')"
      >
        <slot> </slot>
      </Slot>
    </BasicModal>
  </div>
</template>
<script setup lang="ts">
  import { computed, watch } from 'vue';
  import { Avatar } from 'ant-design-vue';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  // import { Slot, VbenAvatar } from '@vben-core/shadcn-ui';

  interface Props {
    avatar?: string;
    zIndex?: number;
    /**
     * @zh_CN 验证码登录路径
     */
    codeLoginPath?: string;
    /**
     * @zh_CN 忘记密码路径
     */
    forgetPasswordPath?: string;

    /**
     * @zh_CN 是否处于加载处理状态
     */
    loading?: boolean;

    /**
     * @zh_CN 二维码登录路径
     */
    qrCodeLoginPath?: string;

    /**
     * @zh_CN 注册路径
     */
    registerPath?: string;

    /**
     * @zh_CN 是否显示验证码登录
     */
    showCodeLogin?: boolean;
    /**
     * @zh_CN 是否显示忘记密码
     */
    showForgetPassword?: boolean;

    /**
     * @zh_CN 是否显示二维码登录
     */
    showQrcodeLogin?: boolean;

    /**
     * @zh_CN 是否显示注册按钮
     */
    showRegister?: boolean;

    /**
     * @zh_CN 是否显示记住账号
     */
    showRememberMe?: boolean;

    /**
     * @zh_CN 是否显示第三方登录
     */
    showThirdPartyLogin?: boolean;

    /**
     * @zh_CN 登录框子标题
     */
    subTitle?: string;

    /**
     * @zh_CN 登录框标题
     */
    title?: string;
    /**
     * @zh_CN 提交按钮文本
     */
    submitButtonText?: string;
  }

  defineOptions({
    name: 'LoginExpiredModal',
  });

  const props = withDefaults(defineProps<Props>(), {
    avatar: '',
    zIndex: 0,
  });

  const open = defineModel<boolean>('open');

  const [registerModal, modalApi] = useModalInner();

  watch(
    () => open.value,
    (val) => {
      modalApi.setState({ isOpen: val });
    },
  );

  const getZIndex = computed(() => {
    return props.zIndex || calcZIndex();
  });

  /**
   * 排除ant-message和loading:9999的z-index
   */
  const zIndexExcludeClass = ['ant-message', 'loading'];
  function isZIndexExcludeClass(element: Element) {
    return zIndexExcludeClass.some((className) => element.classList.contains(className));
  }

  /**
   * 获取最大的zIndex值
   */
  function calcZIndex() {
    let maxZ = 0;
    const elements = document.querySelectorAll('*');
    [...elements].forEach((element) => {
      const style = window.getComputedStyle(element);
      const zIndex = style.getPropertyValue('z-index');
      if (zIndex && !Number.isNaN(Number.parseInt(zIndex)) && !isZIndexExcludeClass(element)) {
        maxZ = Math.max(maxZ, Number.parseInt(zIndex));
      }
    });
    return maxZ + 1;
  }
</script>
