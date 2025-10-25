<template>
  <ModbusDataTable
    :data="data"
    :type="TABLE_TYPE.ATTRIBUTES"
    :table-config="tableConfig"
    @update:data="$emit('update:data', $event)"
  />
</template>

<script lang="ts" setup name="AttributesTable">
  import { PropType, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import ModbusDataTable, { type TableConfig } from './ModbusDataTable.vue';
  import { ModbusAttribute, DATA_TYPE, TABLE_TYPE } from '../type';

  type TableModel = 'slave' | 'server';

  const props = defineProps({
    data: {
      type: Array as PropType<ModbusAttribute[]>,
      default: () => [],
    },
    model: {
      type: String as PropType<TableModel>,
      default: 'slave',
    },
  });

  const emit = defineEmits(['update:data']);
  const { t } = useI18n();

  const tableConfig = computed(
    (): TableConfig => ({
      title: t('tb.gateway.details.table.attributes'),
      addButtonText: t('tb.gateway.details.table.addAttribute'),
      model: props.model,
      defaultData: {
        type: DATA_TYPE.STRING,
        functionCode: 3,
      },
    }),
  );
</script>
