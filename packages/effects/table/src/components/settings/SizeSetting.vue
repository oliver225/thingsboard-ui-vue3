<script lang="ts" setup name="SizeSetting">
import { ListChevronsUpDown } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  VbenDropdownRadioMenu,
  VbenIconButton,
  VbenTooltip,
} from '@vben-core/shadcn-ui';

import { useTableContext } from '../../hooks/useTableContext';

const table = useTableContext();

const sizeList = [
  { label: $t('table.settingDensDefault'), value: 'middle' },
  { label: $t('table.settingDensSmall'), value: 'small' },
];

function handleTitleClick(key: any) {
  table.setProps({
    size: key,
  });
}
</script>
<template>
  <VbenTooltip side="top">
    <template #trigger>
      <div>
        <VbenDropdownRadioMenu
          content-class="w-max min-w-0 whitespace-nowrap"
          :menus="sizeList"
          :model-value="table.getProps.value.size"
          @update:model-value="handleTitleClick"
        >
          <VbenIconButton
            class="hover:animate-[shrink_0.3s_ease-in-out] rounded-md"
          >
            <ListChevronsUpDown class="size-4" />
          </VbenIconButton>
        </VbenDropdownRadioMenu>
      </div>
    </template>
    {{ $t('table.settingDens') }}
  </VbenTooltip>
</template>
