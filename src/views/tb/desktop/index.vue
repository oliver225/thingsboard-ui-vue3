<template>
  <div>
    <CustomerDesktop v-if="getAuthority == Authority.CUSTOMER_USER" />
    <SysAdminDesktop v-if="getAuthority == Authority.SYS_ADMIN" />
    <TenantDesktop v-if="getAuthority == Authority.TENANT_ADMIN" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'Desktop',
  });
</script>
<script lang="ts" setup>
  import { defineComponent } from 'vue';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';
  import CustomerDesktop from './customer/index.vue';
  import SysAdminDesktop from './sysadmin/index.vue';
  import TenantDesktop from './tenant/index.vue';
  const { getAuthority } = useUserStore();
</script>
