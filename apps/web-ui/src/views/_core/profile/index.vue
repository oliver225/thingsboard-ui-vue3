<script lang="ts" setup>
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import { Page, VbenAvatar } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { Menu, MenuItem } from 'antdv-next';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const avatarSrc = computed(
  () => userStore.userInfo?.avatar ?? preferences.app.defaultAvatar,
);

const menuItems = computed(() => [
  {
    icon: 'lucide:user',
    label: $t('tb.account.userInfo'),
    value: '/account/profile',
  },
  {
    icon: 'lucide:shield',
    label: $t('tb.account.security'),
    value: '/account/security',
  },
  {
    icon: 'lucide:key-round',
    label: $t('tb.account.changePassword'),
    value: '/account/modpwd',
  },
  {
    icon: 'lucide:bell',
    label: $t('tb.account.notification'),
    value: '/account/notificationSettings',
  },
]);

const activeMenu = computed(() => {
  const match = menuItems.value.find((item) =>
    route.path.startsWith(item.value),
  );
  return match?.value ?? '/account/profile';
});

function handleMenuClick({ key }: { key: number | string }) {
  const path = String(key);
  if (path !== route.path) {
    router.push(path);
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="bg-card flex h-full overflow-hidden rounded-lg">
      <div class="border-border w-56 shrink-0 border-r">
        <div class="flex flex-col items-center gap-2 py-6">
          <VbenAvatar :src="avatarSrc" class="size-20" />
          <span class="text-foreground text-lg font-semibold">
            {{ userStore.userInfo?.realName ?? '' }}
          </span>
          <span class="text-muted-foreground text-sm">
            {{ userStore.userInfo?.username ?? '' }}
          </span>
        </div>
        <div class="border-border mx-4 border-t"></div>
        <Menu
          class="h-full !border-none !bg-transparent py-2"
          :selected-keys="[activeMenu]"
          mode="inline"
          @click="handleMenuClick"
        >
          <MenuItem v-for="item in menuItems" :key="item.value">
            <template #icon>
              <IconifyIcon :icon="item.icon" />
            </template>
            {{ item.label }}
          </MenuItem>
        </Menu>
      </div>
      <div class="m-4 min-w-0 flex-1 overflow-auto">
        <RouterView />
      </div>
    </div>
  </Page>
</template>
