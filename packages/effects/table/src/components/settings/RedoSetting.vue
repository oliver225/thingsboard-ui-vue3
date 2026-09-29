<script lang="ts" setup name="RedoSetting">
import { RotateCw } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton, VbenTooltip } from '@vben-core/shadcn-ui';

import { useTableContext } from '../../hooks/useTableContext';

const table = useTableContext();

function redo() {
  table.reload();
}
</script>
<template>
  <VbenTooltip side="top">
    <template #trigger>
      <VbenIconButton
        class="hover:animate-[shrink_0.3s_ease-in-out] rounded-md"
        @click="redo"
      >
        <RotateCw class="size-4" />
      </VbenIconButton>
    </template>
    {{ $t('common.refresh') }}
  </VbenTooltip>
</template>
