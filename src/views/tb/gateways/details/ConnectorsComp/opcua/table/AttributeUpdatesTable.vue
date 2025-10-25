<template>
  <OpcuaDataTable
    :data="data"
    :type="TABLE_TYPE.ATTRIBUTE_UPDATES"
    :table-config="tableConfig"
    @update:data="$emit('update:data', $event)"
  />
</template>

<script lang="ts" setup name="OpcuaAttributeUpdatesTable">
  import { PropType, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import OpcuaDataTable, { type TableConfig } from './OpcuaDataTable.vue';
  import { AttributeUpdateMapping, TABLE_TYPE } from '../type';

  const props = defineProps({
    data: {
      type: Array as PropType<AttributeUpdateMapping[]>,
      default: () => [],
    },
  });

  const emit = defineEmits(['update:data']);
  const { t } = useI18n();

  const tableConfig = computed(
    (): TableConfig => ({
      title: t('tb.gateway.details.opcua.table.attributeUpdates'),
      addButtonText: t('tb.gateway.details.opcua.table.addAttributeUpdate'),
      defaultData: {
        key: '',
        type: 'path',
        value: '',
      },
    }),
  );
</script>
