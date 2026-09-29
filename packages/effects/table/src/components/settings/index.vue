<script lang="ts" setup name="TableSetting">
import type { PropType } from 'vue';

import type { ColumnChangeParam, TableSetting } from '../../types/table';

import { computed } from 'vue';

import ColumnSetting from './ColumnSetting.vue';
import FullScreenSetting from './FullScreenSetting.vue';
import RedoSetting from './RedoSetting.vue';
import SizeSetting from './SizeSetting.vue';

const props = defineProps({
  setting: {
    type: Object as PropType<TableSetting>,
    default: () => ({}),
  },
});

const emit = defineEmits(['columnsChange']);

const getSetting = computed((): TableSetting => {
  return {
    redo: false,
    size: true,
    setting: true,
    fullScreen: false,
    ...props.setting,
  };
});

function handleColumnChange(data: ColumnChangeParam[]) {
  emit('columnsChange', data);
}
</script>
<template>
  <div class="table-settings">
    <RedoSetting v-if="getSetting.redo" />
    <SizeSetting v-if="getSetting.size" />
    <ColumnSetting
      v-if="getSetting.setting"
      @columns-change="handleColumnChange"
    />
    <FullScreenSetting v-if="getSetting.fullScreen" />
  </div>
</template>
<style lang="less">
.table-settings {
  & > * {
    margin-left: 4px;
    font-size: calc((var(--font-size-base)) * 0.88);
    vertical-align: middle;
  }

  svg {
    width: 1.3em;
    height: 1.3em;
  }
}

html.dark {
  .table-settings {
    color: #c9d1d9;

    svg {
      color: #afafaf;
    }
  }
}
</style>
