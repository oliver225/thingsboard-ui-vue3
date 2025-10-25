<template>
  <OpcuaDataTable
    :data="data"
    :type="TABLE_TYPE.TIMESERIES"
    :table-config="tableConfig"
    @update:data="$emit('update:data', $event)"
  />
</template>

<script lang="ts" setup name="OpcuaTimeseriesTable">
  import { PropType, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import OpcuaDataTable, { type TableConfig } from './OpcuaDataTable.vue';
  import { AttributeMapping, TABLE_TYPE } from '../type';

  const props = defineProps({
    data: {
      type: Array as PropType<AttributeMapping[]>,
      default: () => [],
    },
  });

  const emit = defineEmits(['update:data']);
  const { t } = useI18n();

  const tableConfig = computed(
    (): TableConfig => ({
      title: t('tb.gateway.details.opcua.table.timeSeries'),
      addButtonText: t('tb.gateway.details.opcua.table.addTimeSeries'),
      showAdvancedConfig: true,
      defaultData: {
        key: '',
        type: 'path',
        value: '',
      },
    }),
  );
</script>
