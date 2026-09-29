<script lang="ts" setup>
import { computed, ref } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page, useVbenModal, VbenButton, VbenSegmented } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Authority } from '#/enums';
import { $t } from '#/locales';

import RequestForm from './request/form.vue';

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const activeListRef = ref<{ reload?: () => Promise<unknown> }>();
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RequestForm,
  destroyOnClose: true,
});

const menuItems = computed(() =>
  [
    {
      authority: [
        Authority.SYS_ADMIN,
        Authority.TENANT_ADMIN,
        Authority.CUSTOMER_USER,
      ],
      label: $t('notification.sections.inbox'),
      value: '/notification/inbox',
    },
    {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      label: $t('notification.sections.sent'),
      value: '/notification/request',
    },
    {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      label: $t('notification.sections.recipients'),
      value: '/notification/recipients',
    },
    {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      label: $t('notification.sections.templates'),
      value: '/notification/templates',
    },
    {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      label: $t('notification.sections.rules'),
      value: '/notification/rules',
    },
  ]
    .filter((item) => hasAccessByRoles(item.authority))
    .map((item) => ({
      ...item,
      icon: router.resolve(item.value).meta.icon,
    })),
);

const activeMenu = computed(() => {
  if (route.name === 'NotificationRequest') return '/notification/request';
  const match = menuItems.value.find((item) =>
    route.path.startsWith(item.value),
  );
  return match?.value ?? '/notification/inbox';
});

function handleSendNotification() {
  formModalApi.setData({}).open();
}

function onSuccess() {
  return route.name === 'NotificationRequest'
    ? activeListRef.value?.reload?.()
    : router.push('/notification/request');
}

function handleNavigateList(key: string | undefined) {
  if (!key) return;
  const path = String(key);
  if (path !== route.path) {
    return router.push(path);
  }
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onSuccess" />
    <div class="bg-card flex h-full flex-col overflow-hidden rounded-lg">
      <div
        class="border-border/60 flex flex-wrap items-center gap-3 border-b px-3 py-2"
      >
        <div class="min-w-0 overflow-x-auto overflow-y-hidden">
          <VbenSegmented
            variant="navigation"
            :tabs="menuItems"
            :model-value="activeMenu"
            @update:model-value="handleNavigateList"
          />
        </div>
        <VbenButton
          v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
          class="ml-auto shrink-0 gap-2"
          @click="handleSendNotification"
        >
          <IconifyIcon icon="lucide:send" class="size-4" aria-hidden="true" />
          {{ $t('notification.features.request.actions.send') }}
        </VbenButton>
      </div>
      <div class="min-h-0 flex-1">
        <RouterView v-slot="{ Component }">
          <component :is="Component" ref="activeListRef" />
        </RouterView>
      </div>
    </div>
  </Page>
</template>
