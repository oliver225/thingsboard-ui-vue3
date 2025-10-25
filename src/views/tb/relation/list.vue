<template>
  <div class="relation-list">
    <BasicTable @register="registerTable">
      <template #headerTop v-if="isEmpty(props.entityType)">
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #toolbar>
        <Tooltip placement="bottom">
          <template #title>
            <span>{{ t('tb.relation.action.add') }}</span>
          </template>
          <Icon
            icon="ant-design:plus-outlined"
            :size="20"
            class="cursor-pointer"
            @click="handleForm({})"
            v-if="hasPermission(Authority.TENANT_ADMIN)"
          />
        </Tooltip>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <Segmented
            v-model:value="direction"
            @change="handleDirectionChange"
            :options="[
              { label: t('tb.relation.direction.outgoing'), value: 'From' },
              { label: t('tb.relation.direction.incoming'), value: 'To' },
            ]"
          />
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('common.search.searchText')"
            allow-clear
            @change="reload()"
            style="width: 240px"
          >
            <template #suffix>
              <Icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
        </div>
      </template>
      <template #toName="{ record }">
        {{ record.toName }}
      </template>
      <template #fromName="{ record }">
        {{ record.fromName }}
      </template>
      <template #extra="{ record }">
        <span v-if="direction == 'To'">
          {{ t('tb.relation.common.from') }}
          <strong>
            {{ ENTITY_TYPE_OPTIONS.find((item) => item.value === record.from.entityType)?.label }} ({{
              record.fromName
            }})
          </strong>
          <Tag color="blue">{{ record.type }}</Tag>
          {{ t('tb.relation.common.current')
          }}{{ ENTITY_TYPE_OPTIONS.find((item) => item.value === props.entityType)?.label }}
        </span>
        <span v-if="direction == 'From'">
          {{ t('tb.relation.common.from') }} {{ t('tb.relation.common.current')
          }}{{ ENTITY_TYPE_OPTIONS.find((item) => item.value === props.entityType)?.label }}
          <Tag color="blue">{{ record.type }}</Tag>
          <strong>
            {{ ENTITY_TYPE_OPTIONS.find((item) => item.value === record.to.entityType)?.label }} ({{ record.toName }})
          </strong>
        </span>
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbRelationList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive, ref } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { isEmpty } from 'lodash-es';
  import { Icon } from '/@/components/Icon';
  import { useUserStore } from '/@/store/modules/user';
  import { router } from '/@/router';
  import { Tag, Segmented, Tooltip } from 'ant-design-vue';
  import { findRelationInfoListByFrom, findRelationInfoListByTo, deleteRelation } from '/@/api/tb/relation';
  import { ENTITY_TYPE_OPTIONS, EntityType } from '/@/enums/entityTypeEnum';
  import { Authority } from '/@/enums/authorityEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
  import InputForm from './form.vue';
  import { useModal } from '/@/components/Modal';

  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.relation.title'),
  };

  const props = defineProps({
    entityType: {
      type: String as PropType<EntityType>,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
  });

  const direction = ref('From');

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.relation.table.type'),
      key: 'type',
      dataIndex: 'type',
      width: 140,
      sorter: true,
    },
    {
      title: t('tb.relation.table.toEntityType'),
      dataIndex: 'to.entityType',
      key: 'to.entityType',
      width: 140,
      format: (text: any) => (text ? ENTITY_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
      ifShow: direction.value == 'From',
    },
    {
      title: t('tb.relation.table.toEntityName'),
      dataIndex: 'toName',
      key: 'toName',
      slot: 'toName',
      ifShow: direction.value == 'From',
    },
    {
      title: t('tb.relation.table.fromEntityType'),
      dataIndex: 'from.entityType',
      key: 'from.entityType',
      width: 140,
      format: (text: any) => (text ? ENTITY_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
      ifShow: direction.value == 'To',
    },
    {
      title: t('tb.relation.table.fromEntityName'),
      dataIndex: 'fromName',
      key: 'fromName',
      slot: 'fromName',
      ifShow: direction.value == 'To',
    },
    {
      title: t('tb.relation.table.description'),
      dataIndex: 'extra',
      align: 'left',
      slot: 'extra',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
    ifShow: hasPermission(Authority.TENANT_ADMIN),
    actions: (record: Recordable) => [
      {
        icon: 'i-clarity:note-edit-line',
        title: t('tb.relation.action.edit'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        color: 'success',
        onClick: handleForm.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.relation.action.delete'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();

  const [registerTable, { reload, updateColumn }] = useTable({
    api: fetchRelationList,
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  async function fetchRelationList(param: any) {
    if (isEmpty(props.entityType) || isEmpty(props.entityId)) {
      return [];
    } else if (direction.value == 'From') {
      return await findRelationInfoListByFrom({ ...param, fromId: props.entityId, fromType: props.entityType });
    } else {
      return await findRelationInfoListByTo({ ...param, toId: props.entityId, toType: props.entityType });
    }
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.relation.confirm.deleteTitle', {
        name: direction.value == 'From' ? record.toName : record.fromName,
      }),
      content: t('tb.relation.confirm.deleteContent', {
        name: direction.value == 'From' ? record.toName : record.fromName,
      }),
      centered: false,
      okText: t('tb.relation.confirm.deleteOk'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteRelation({
            fromId: record.from.id,
            fromType: record.from.entityType,
            relationType: record.type,
            toId: record.to.id,
            toType: record.to.entityType,
          });
          showMessage(t('tb.relation.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleForm(record: Recordable) {
    if (direction.value == 'From') {
      openModal(true, { ...record, from: { id: props.entityId, entityType: props.entityType }, direction: 'From' });
    } else {
      openModal(true, { ...record, to: { id: props.entityId, entityType: props.entityType }, direction: 'To' });
    }
  }

  function handleSuccess() {
    reload();
  }

  function handleDirectionChange(value: any) {
    reload();
    updateColumn([
      {
        title: t('tb.relation.table.toEntityType'),
        dataIndex: 'to.entityType',
        key: 'to.entityType',
        format: (text: any) => (text ? ENTITY_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
        ifShow: value == 'From',
      },
      {
        title: t('tb.relation.table.toEntityName'),
        dataIndex: 'toName',
        key: 'toName',
        slot: 'toName',
        ifShow: value == 'From',
      },
      {
        title: t('tb.relation.table.fromEntityType'),
        dataIndex: 'from.entityType',
        key: 'from.entityType',
        format: (text: any) => (text ? ENTITY_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
        ifShow: value == 'To',
      },
      {
        title: t('tb.relation.table.fromEntityName'),
        dataIndex: 'fromName',
        key: 'fromName',
        slot: 'fromName',
        ifShow: value == 'To',
      },
    ]);
  }
</script>
<style lang="less">
  .relation-list {
  }
</style>
