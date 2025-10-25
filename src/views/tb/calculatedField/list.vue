<template>
  <div class="calculated-field-index">
    <BasicTable @register="registerTable">
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})" v-show="hasPermission(Authority.TENANT_ADMIN)">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.calculatedField.action.add') }}
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('common.search.searchText')"
            allow-clear
            @change="reload"
            style="width: 240px"
          >
            <template #suffix>
              <icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
        </div>
      </template>
      <template #debugSettings="{ record }">
        <DebugSetting
          :inForm="false"
          v-model:value="record.debugSettings"
          @change="(debugSettings) => handleUpdateDebugSetting({ ...record, debugSettings: debugSettings })"
        />
      </template>
    </BasicTable>
    <EventModal @register="registerEventModal" />
    <InputForm @register="registerFormModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbCalculatedFieldDebugSetting',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, h, reactive } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import {
    deleteCalculatedFieldById,
    getCalculatedFieldByEntityId,
    saveCalculatedField,
  } from '/@/api/tb/calculatedField';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';
  import { useModal } from '/@/components/Modal';
  import EventModal from './eventModal.vue';
  import DebugSetting from './debugSetting.vue';
  import InputForm from './form.vue';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();
  const { hasPermission } = usePermission();

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

  const searchParam = reactive({
    textSearch: '',
  });

  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.calculatedField.table.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      ellipsis: false,
      width: 200,
    },
    {
      title: t('tb.calculatedField.table.type'),
      dataIndex: 'type',
      key: 'type',
      sorter: true,
      customRender: ({ value }) => {
        return value === 'SIMPLE' ? t('tb.calculatedField.form.type_simple') : t('tb.calculatedField.form.type_script');
      },
      width: 100,
    },
    {
      title: t('tb.calculatedField.table.expression'),
      dataIndex: 'configuration.expression',
      key: 'expression',
      align: 'left',
      ellipsis: false,
    },
    {
      title: t('tb.calculatedField.table.createdTime'),
      dataIndex: 'createdTime',
      key: 'createdTime',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 160,
      align: 'center',
    },
    {
      title: t('调试'),
      dataIndex: 'debugSettings',
      key: 'debugSettings',
      width: 60,
      slot: 'debugSettings',
      align: 'center',
    },
  ];
  const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
      {
        icon: 'i-ant-design:exception-outlined',
        tooltip: t('事件'),
        auth: Authority.TENANT_ADMIN,
        onClick: handleOpenEvent.bind(this, { ...record }),
      },
      {
        icon: 'i-ant-design:edit-outlined',
        color: 'success',
        tooltip: t('tb.calculatedField.action.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: handleForm.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        tooltip: t('tb.calculatedField.action.delete'),
        auth: Authority.TENANT_ADMIN,
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerFormModal, { openModal: openFormModal }] = useModal();
  const [registerEventModal, { openModal: openEventModal }] = useModal();
  const [registerTable, { reload }] = useTable({
    api: (param) => getCalculatedFieldByEntityId({ entityType: props.entityType, id: props.entityId }, param),
    rowKey: (record) => record.id.id,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function handleSuccess() {
    reload();
  }

  function handleForm(record: Recordable) {
    const payload: Recordable = { ...record };
    // 新增时（无 id）拼接 entityId 传给表单
    if (!record?.id) {
      payload.entityId = { entityType: props.entityType, id: props.entityId };
    }
    openFormModal(true, payload);
  }

  async function handleUpdateDebugSetting(record: Recordable) {
    const data = await saveCalculatedField(record);
    handleSuccess();
  }

  function handleOpenEvent(record: Recordable) {
    openEventModal(true, { ...record });
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.calculatedField.action.deleteConfirm', { name: record.name }),
      content: t('tb.calculatedField.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.calculatedField.action.delete'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteCalculatedFieldById(record.id.id);
          showMessage(t('tb.calculatedField.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }
</script>
