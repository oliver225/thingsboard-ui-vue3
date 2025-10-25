<template>
  <Table :columns="columns" :dataSource="dataSource" :pagination="false" size="small" :rowKey="rowKeyFn">
    <template #bodyCell="{ column, record, index }">
      <template v-if="column.key === 'entityType'">
        <span>{{ ARGUMENT_ENTITY_TYPE_MAP[record.entityType] || record.entityType }}</span>
      </template>
      <template v-else-if="column.key === 'targetEntity'">
        <span>{{ record.targetEntityName || '-' }}</span>
      </template>
      <template v-else-if="column.key === 'type'">
        <span>{{ record.type ? ARGUMENT_TYPE_MAP[record.type] || record.type : '-' }}</span>
      </template>
      <template v-else-if="column.key === 'key'">
        <span>{{ record.key || '-' }}</span>
      </template>
      <template v-else-if="column.key === 'defaultValue'">
        <span>{{ record.defaultValue ?? '-' }}</span>
      </template>
      <template v-else-if="column.key === 'action'">
        <Space v-if="!readOnly">
          <Button type="link" size="small" @click="$emit('edit', record, index)">
            <Icon icon="ant-design:edit-outlined" />
          </Button>
          <Button type="link" danger size="small" @click="$emit('delete', index)">
            <Icon icon="ant-design:delete-outlined" />
          </Button>
        </Space>
      </template>
    </template>
  </Table>
</template>

<script lang="ts" setup name="CalculatedFieldArgumentsTable">
  import { computed } from 'vue';
  import { Table, Space, Button } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ARGUMENT_ENTITY_TYPE_MAP, ARGUMENT_TYPE_MAP } from '/@/enums/calculatedFieldEnum';

  interface ArgumentRecord {
    name: string;
    entityType: string;
    targetEntityName?: string;
    type?: string;
    key?: string;
    defaultValue?: string;
  }

  defineProps<{ dataSource: ArgumentRecord[]; readOnly?: boolean }>();
  defineEmits(['edit', 'delete']);

  const { t } = useI18n('tb');

  const columns = computed(() => [
    { title: t('tb.calculatedField.argument.name'), dataIndex: 'name', key: 'name', width: 150 },
    { title: t('tb.calculatedField.argument.entityType'), dataIndex: 'entityType', key: 'entityType', width: 120 },
    {
      title: t('tb.calculatedField.argument.targetEntity'),
      dataIndex: 'targetEntity',
      key: 'targetEntity',
      width: 120,
    },
    { title: t('tb.calculatedField.argument.type'), dataIndex: 'type', key: 'type', width: 150 },
    { title: t('tb.calculatedField.form.key'), dataIndex: 'key', key: 'key', width: 150 },
    {
      title: t('tb.calculatedField.argument.defaultValue'),
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      width: 150,
    },
    { title: t('common.action'), key: 'action', width: 100, fixed: 'right' as const },
  ]);

  function rowKeyFn(_record: any, index?: number) {
    return String(index ?? 0);
  }

  defineExpose({});
</script>
