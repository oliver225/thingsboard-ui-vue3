<script lang="ts" setup>
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Menu, MenuItem } from 'antdv-next';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();

/** 全部子项按角色过滤:系统设置(SYS_ADMIN)/ 租户设置(TENANT_ADMIN) */
const menuItems = computed(() =>
  [
    {
      authority: [Authority.SYS_ADMIN],
      icon: 'lucide:sliders-horizontal',
      label: $t('tb.settings.general'),
      value: '/settings/general',
    },
    {
      authority: [Authority.SYS_ADMIN],
      icon: 'lucide:mail',
      label: $t('tb.settings.outgoingMail'),
      value: '/settings/outgoing-mail',
    },
    {
      authority: [Authority.SYS_ADMIN],
      icon: 'lucide:bell',
      label: $t('tb.settings.notifications'),
      value: '/settings/notifications',
    },
    {
      authority: [Authority.SYS_ADMIN],
      icon: 'lucide:layers',
      label: $t('tb.settings.queues'),
      value: '/settings/queues',
    },
    {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:house',
      label: $t('tb.settings.home'),
      value: '/settings/home',
    },
    {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:bot',
      label: $t('tb.settings.aiModels'),
      value: '/settings/ai-models',
    },
  ].filter((item) => hasAccessByRoles(item.authority)),
);

const activeMenu = computed(() => {
  const match = menuItems.value.find((item) =>
    route.path.startsWith(item.value),
  );
  return match?.value ?? menuItems.value[0]?.value ?? '';
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
      <div class="min-w-0 flex-1 overflow-auto m-4">
        <RouterView />
      </div>
    </div>
  </Page>
</template>
