<template>
  <OpcuaDataTable
    :data="data"
    :type="TABLE_TYPE.RPC"
    :table-config="tableConfig"
    @update:data="$emit('update:data', $event)"
  />
</template>

<script lang="ts" setup name="OpcuaRpcMethodsTable">
  import { PropType, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import OpcuaDataTable, { type TableConfig } from './OpcuaDataTable.vue';
  import { RpcMethodMapping, TABLE_TYPE } from '../type';

  const props = defineProps({
    data: {
      type: Array as PropType<RpcMethodMapping[]>,
      default: () => [],
    },
  });

  const emit = defineEmits(['update:data']);
  const { t } = useI18n();

  const tableConfig = computed(
    (): TableConfig => ({
      title: t('tb.gateway.details.opcua.table.rpcMethods'),
      addButtonText: t('tb.gateway.details.opcua.table.addRpcMethod'),
      defaultData: {
        method: '',
        arguments: [
          {
            type: 'integer',
            value: 0,
          },
        ],
      },
    }),
  );
</script>
