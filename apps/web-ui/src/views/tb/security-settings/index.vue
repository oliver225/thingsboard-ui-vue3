<script lang="ts" setup>
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Menu, MenuItem } from 'antdv-next';

import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();

const menuItems = computed(() => [
  {
    icon: 'lucide:shield',
    label: $t('tb.securitySettings.general.title'),
    value: '/security-settings/general',
  },
  {
    icon: 'lucide:file-key',
    label: $t('tb.securitySettings.jwt.title'),
    value: '/security-settings/jwt',
  },
  {
    icon: 'lucide:key-round',
    label: $t('tb.securitySettings.twoFa.title'),
    value: '/security-settings/2fa',
  },
]);

const activeMenu = computed(() => {
  const match = menuItems.value.find((item) =>
    route.path.startsWith(item.value),
  );
  return match?.value ?? '/security-settings/general';
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
      <div class="border-border w-56 shrink-0 border-r py-2">
        <Menu
          class="h-full !border-none !bg-transparent"
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
