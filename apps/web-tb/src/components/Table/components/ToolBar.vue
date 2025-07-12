<script lang="ts" setup>
import type { PropType } from 'vue';

import type { VxeGridApi } from '@vben/plugins/vxe-table';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

const props = defineProps({
  api: {
    type: Object as PropType<VxeGridApi>,
    required: true,
  },
});
function reload() {
  props.api.reload();
}
</script>

<template>
  <div class="flex items-center gap-2">
    <VbenIconButton
      v-tippy="{
        content: `${$t('page.refresh.title')}`,
        theme: 'dark',
        delay: 100,
        animation: 'shift-away',
      }"
    >
      <IconifyIcon class="size-6" icon="mdi:refresh" @click="reload()" />
    </VbenIconButton>
  </div>
</template>
