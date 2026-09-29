<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import { Page, useVbenModal, VbenAvatar } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { message, Upload } from 'antdv-next';

import { $t } from '#/locales';

import AvatarModal from './avatar-modal.vue';

const route = useRoute();
const userStore = useUserStore();
const [AvatarModalView, avatarModalApi] = useVbenModal({
  connectedComponent: AvatarModal,
  destroyOnClose: true,
});
const avatar = computed(
  () => userStore.userInfo?.avatar || preferences.app.defaultAvatar,
);
const items = computed(() => [
  {
    path: '/account/profile',
    title: $t('account.sections.userInfo'),
    icon: 'lucide:user',
  },
  {
    path: '/account/security',
    title: $t('account.sections.security'),
    icon: 'lucide:shield',
  },
  { path: '/account/apiKeys', title: $t('api-key.menu'), icon: 'lucide:key' },
  {
    path: '/account/notificationSettings',
    title: $t('account.sections.notification'),
    icon: 'lucide:bell',
  },
]);

function handleSelectAvatar(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    message.error($t('account.validation.avatarFormat'));
    return Upload.LIST_IGNORE;
  }
  if (file.size > 2 * 1024 * 1024) {
    message.error($t('account.validation.avatarSize'));
    return Upload.LIST_IGNORE;
  }
  avatarModalApi.setData({ file }).open();
  return Upload.LIST_IGNORE;
}
</script>
<template>
  <Page auto-content-height>
    <AvatarModalView />
    <div
      class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground [font-family:inherit] md:flex-row"
    >
      <nav
        class="flex min-w-0 shrink-0 gap-1 overflow-auto border-b border-border p-2 text-[length:var(--menu-font-size)] md:block md:basis-[260px] md:overflow-y-auto md:border-r md:border-b-0 md:py-4"
        :aria-label="$t('account.menu')"
      >
        <div
          class="hidden min-w-0 flex-col items-center gap-2 border-b border-border px-2 pb-6 pt-2 md:mb-4 md:flex"
        >
          <Upload
            accept="image/jpeg,image/png,image/webp"
            :show-upload-list="false"
            :before-upload="handleSelectAvatar"
          >
            <button
              type="button"
              class="group relative block size-22 cursor-pointer overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              :aria-label="$t('account.actions.changeAvatar')"
              :title="$t('account.actions.changeAvatar')"
            >
              <VbenAvatar :src="avatar" class="size-22" />
              <span
                class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                aria-hidden="true"
              >
                <IconifyIcon icon="lucide:camera" class="size-5" />
                <span class="text-xs">{{
                  $t('account.actions.changeAvatar')
                }}</span>
              </span>
            </button>
          </Upload>
          <span
            class="max-w-full truncate text-lg font-semibold"
            :title="userStore.userInfo?.realName"
            >{{ userStore.userInfo?.realName }}</span>
          <span
            class="max-w-full truncate text-sm text-muted-foreground"
            :title="userStore.userInfo?.username"
            >{{ userStore.userInfo?.username }}</span>
          <span
            v-if="userStore.userInfo?.roles?.[0]"
            class="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground"
            >{{ $t(`tb.authority.${userStore.userInfo.roles[0]}`) }}</span>
        </div>
        <RouterLink
          v-for="item in items"
          :key="item.path"
          :to="item.path"
          class="flex min-h-[38px] shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-[length:inherit] font-normal leading-[22px] whitespace-nowrap text-foreground/85! transition-colors duration-150 hover:bg-accent! focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px] aria-[current=page]:bg-primary/10! aria-[current=page]:font-medium aria-[current=page]:text-primary! md:mb-1 md:whitespace-normal"
          :aria-current="route.path === item.path ? 'page' : undefined"
        >
          <IconifyIcon :icon="item.icon" class="size-4 shrink-0" />
          <span>{{ item.title }}</span>
        </RouterLink>
      </nav>
      <main
        class="min-h-0 min-w-0 flex-1"
        :class="
          route.path === '/account/apiKeys'
            ? 'overflow-auto p-0.5 md:p-1'
            : 'overflow-hidden'
        "
      >
        <RouterView v-slot="{ Component }">
          <component :is="Component" :key="route.path" />
        </RouterView>
      </main>
    </div>
  </Page>
</template>
