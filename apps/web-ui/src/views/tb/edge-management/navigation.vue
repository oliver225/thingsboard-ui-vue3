<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router';

import { VbenSegmented } from '@vben/common-ui';

import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();

function handleNavigateList(name: string | undefined) {
  if (name === route.name) return;
  if (name === 'EdgeInstances' || name === 'EdgeRuleChains') {
    return router.push({ name });
  }
}
</script>

<template>
  <VbenSegmented
    variant="navigation"
    :aria-label="$t('edge-management.menu')"
    :tabs="[
      {
        icon: $router.resolve({ name: 'EdgeInstances' }).meta.icon,
        label: $t('edge-management.features.instances.title'),
        value: 'EdgeInstances',
      },
      {
        icon: $router.resolve({ name: 'EdgeRuleChains' }).meta.icon,
        label: $t('edge-management.features.ruleChains.title'),
        value: 'EdgeRuleChains',
      },
    ]"
    :model-value="String(route.name)"
    @update:model-value="handleNavigateList"
  />
</template>
