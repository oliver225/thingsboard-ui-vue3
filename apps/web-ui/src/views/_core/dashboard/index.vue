<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Authority } from '#/enums';

import Forbidden from '../fallback/forbidden.vue';

const SystemHome = defineAsyncComponent(() => import('./sysadmin/index.vue'));
const TenantHome = defineAsyncComponent(() => import('./tenant/index.vue'));
const CustomerHome = defineAsyncComponent(() => import('./customer/index.vue'));
const userStore = useUserStore();
const home = computed(() => {
  if (userStore.userRoles.includes(Authority.SYS_ADMIN)) return SystemHome;
  if (userStore.userRoles.includes(Authority.TENANT_ADMIN)) return TenantHome;
  if (userStore.userRoles.includes(Authority.CUSTOMER_USER))
    return CustomerHome;
  return Forbidden;
});
</script>

<template>
  <Page
    auto-content-height
    :content-class="home !== Forbidden ? '!overflow-hidden' : undefined"
  >
    <component :is="home" :key="userStore.userInfo?.userId" />
  </Page>
</template>
