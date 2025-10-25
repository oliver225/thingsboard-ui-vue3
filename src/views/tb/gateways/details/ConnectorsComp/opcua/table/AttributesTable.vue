<template>
  <OpcuaDataTable
    :data="data"
    :type="TABLE_TYPE.ATTRIBUTES"
    :table-config="tableConfig"
    @update:data="$emit('update:data', $event)"
  />
</template>

<script lang="ts" setup name="OpcuaAttributesTable">
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
      title: t('tb.gateway.details.opcua.table.attributes'),
      addButtonText: t('tb.gateway.details.opcua.table.addAttribute'),
      showAdvancedConfig: true,
      defaultData: {
        key: '',
        type: 'path',
        value: '',
      },
    }),
  );
</script>
