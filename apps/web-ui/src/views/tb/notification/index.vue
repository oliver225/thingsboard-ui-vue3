<script lang="ts" setup>
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Menu, MenuItem } from 'antdv-next';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();

const menuItems = computed(() =>
  [
    {
      authority: [
        Authority.SYS_ADMIN,
        Authority.TENANT_ADMIN,
        Authority.CUSTOMER_USER,
      ],
      icon: 'lucide:inbox',
      label: $t('tb.notification.inbox'),
      value: '/notification/inbox',
    },
    {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:send',
      label: $t('tb.notification.sent'),
      value: '/notification/sent',
    },
    {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:users',
      label: $t('tb.notification.recipients'),
      value: '/notification/recipients',
    },
    {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:file-text',
      label: $t('tb.notification.templates'),
      value: '/notification/templates',
    },
    {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:workflow',
      label: $t('tb.notification.rules'),
      value: '/notification/rules',
    },
  ].filter((item) => hasAccessByRoles(item.authority)),
);

const activeMenu = computed(() => {
  const match = menuItems.value.find((item) =>
    route.path.startsWith(item.value),
  );
  return match?.value ?? '/notification/inbox';
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
    <div class="bg-card flex h-full flex-col overflow-hidden rounded-lg">
      <div class="flex items-center justify-between gap-4 border-b px-2">
        <Menu
          class="flex-1 !border-none !bg-transparent"
          :selected-keys="[activeMenu]"
          mode="horizontal"
          @click="handleMenuClick"
        >
          <MenuItem v-for="item in menuItems" :key="item.value">
            <template #icon>
              <IconifyIcon :icon="item.icon" />
            </template>
            {{ item.label }}
          </MenuItem>
        </Menu>
        <Button
          v-if="hasAccessByRoles([Authority.SYS_ADMIN, Authority.TENANT_ADMIN])"
          type="primary"
          class="mr-2 shrink-0"
        >
          <template #icon>
            <IconifyIcon icon="lucide:send" />
          </template>
          {{ $t('tb.notification.send') }}
        </Button>
      </div>
      <div class="min-h-0 flex-1">
        <RouterView />
      </div>
    </div>
  </Page>
</template>
