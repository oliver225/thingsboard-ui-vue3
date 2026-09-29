<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { BasicLayout, LockScreen, UserDropdown } from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { THINGSBOARD_DOC_URL } from '#/constants';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

import NotificationBell from './notification/index.vue';

const accessStore = useAccessStore();
const userStore = useUserStore();
const authStore = useAuthStore();
const router = useRouter();
const roleLabel = computed(() => {
  const role = userStore.userInfo?.roles?.[0];
  return role ? $t(`tb.authority.${role}`) : '';
});
const menus = computed(() => [
  {
    text: $t('account.menu'),
    icon: 'lucide:user-round',
    handler: () => router.push('/account/profile'),
  },
  {
    text: $t('account.actions.documentation'),
    icon: 'lucide:book-open',
    handler: () =>
      window.open(THINGSBOARD_DOC_URL, '_blank', 'noopener,noreferrer'),
  },
  {
    text: $t('account.actions.technicalSupport'),
    icon: 'lucide:headset',
    handler: () =>
      window.open('http://pincore.cn/', '_blank', 'noopener,noreferrer'),
  },
  {
    text: 'GitHub',
    icon: 'lucide:github',
    handler: () =>
      window.open(
        'https://github.com/oliver225/thingsboard-ui-vue',
        '_blank',
        'noopener,noreferrer',
      ),
  },
]);
const avatar = computed(
  () => userStore.userInfo?.avatar || preferences.app.defaultAvatar,
);
const handleLogout = () => authStore.logout(false);
</script>
<template>
  <BasicLayout
    :avatar
    :text="userStore.userInfo?.realName"
    @logout="handleLogout"
    @clear-preferences-and-logout="handleLogout"
  >
    <template #notification>
      <NotificationBell />
    </template>
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        show-user-info
        :avatar-dot="false"
        trigger="click"
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.username"
        :tag-text="roleLabel"
        @logout="handleLogout"
        @clear-preferences-and-logout="handleLogout"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
