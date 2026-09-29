<script setup lang="ts">
import { onScopeDispose, ref } from 'vue';

import { useVbenModal, VCropper } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from 'antdv-next';

import { getCurrentUser } from '#/api/tb/auth';
import { saveUser } from '#/api/tb/user';
import { $t } from '#/locales';

const userStore = useUserStore();
const cropperRef = ref<InstanceType<typeof VCropper>>();
const imageUrl = ref('');
const cropperWidth = Math.min(440, window.innerWidth - 96);

const [Modal, modalApi] = useVbenModal<{ file: File }>({
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const file = modalApi.getData()?.file;
    if (!file) return;
    modalApi.lock();
    imageUrl.value = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = imageUrl.value;
      await image.decode();
    } catch {
      message.error($t('account.messages.avatarReadFailed'));
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  async onConfirm() {
    if (modalState.value.submitting || !cropperRef.value) return;
    modalApi.lock();
    try {
      // 裁剪组件会乘设备像素比，此处保证最终图片为 256 × 256 像素。
      const targetSize = 256 / (window.devicePixelRatio || 1);
      const avatar = await cropperRef.value
        .getCropImage('image/jpeg', 0.85, 'base64', targetSize, targetSize)
        .catch(() => undefined);
      if (typeof avatar !== 'string') {
        message.error($t('account.messages.avatarReadFailed'));
        return;
      }
      const currentUser = await getCurrentUser();
      const additionalInfo = { ...currentUser.additionalInfo, avatar };
      const additionalInfoSize = new TextEncoder().encode(
        JSON.stringify(additionalInfo),
      ).length;
      // 后端 NoXss 校验的 maxInputSize 为 100000，Base64 也计入此限制。
      if (additionalInfoSize > 100_000) {
        message.error($t('account.validation.avatarDataSize'));
        return;
      }
      const savedUser = await saveUser({
        ...currentUser,
        additionalInfo,
      });
      if (userStore.userInfo) {
        userStore.setUserInfo({
          ...userStore.userInfo,
          avatar: savedUser.additionalInfo?.avatar ?? '',
          tbUser: savedUser,
        });
      }
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();

onScopeDispose(() => URL.revokeObjectURL(imageUrl.value));
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-xl rounded-xl"
    :title="$t('account.actions.changeAvatar')"
    :description="$t('account.messages.avatarHint')"
    :confirm-text="$t('tb.common.save')"
  >
    <div class="flex justify-center overflow-hidden">
      <VCropper
        v-if="imageUrl"
        ref="cropperRef"
        :img="imageUrl"
        aspect-ratio="1:1"
        :width="cropperWidth"
        :height="320"
      />
    </div>
  </Modal>
</template>
