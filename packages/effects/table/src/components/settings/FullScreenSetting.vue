<script lang="ts" setup name="FullScreenSetting">
import { Maximize, Minimize } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton, VbenTooltip } from '@vben-core/shadcn-ui';

import { useFullscreen } from '@vueuse/core';

import { useTableContext } from '../../hooks/useTableContext';

const table = useTableContext();
const { toggle, isFullscreen } = useFullscreen(table.wrapRef);
</script>
<template>
  <VbenTooltip side="top">
    <template #trigger>
      <VbenIconButton
        class="hover:animate-[shrink_0.3s_ease-in-out] rounded-md"
        @click="toggle"
      >
        <Maximize v-if="!isFullscreen" class="text-foreground size-4" />
        <Minimize v-else class="text-foreground size-4" />
      </VbenIconButton>
    </template>
    {{ $t('table.settingFullScreen') }}
  </VbenTooltip>
</template>
