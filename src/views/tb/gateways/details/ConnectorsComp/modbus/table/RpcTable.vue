<template>
  <ModbusDataTable
    :data="data"
    :type="TABLE_TYPE.RPC"
    :table-config="tableConfig"
    @update:data="$emit('update:data', $event)"
  />
</template>

<script lang="ts" setup name="RpcTable">
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
      title: t('tb.gateway.details.table.rpcRequests'),
      addButtonText: t('tb.gateway.details.table.addRpcRequest'),
      model: props.model,
      defaultData: {
        type: DATA_TYPE.BITS,
        functionCode: 5,
      },
    }),
  );
</script>
