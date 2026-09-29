<script setup lang="ts">
import { Alert } from 'antdv-next';

import CopyBlock from '#/components/widget/copy-block.vue';
import { $t } from '#/locales';

defineProps<{ token: string }>();
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <Alert :title="$t('api-key.messages.tokenOnce')" type="warning" show-icon />
    <CopyBlock :text="token" :button-text="$t('api-key.actions.copyToken')" />
  </div>
</template>
