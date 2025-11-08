<template>
  <div class="widget-type-list">
    <BasicTable @register="registerTable">
      <!-- <template #headerTop>
        <div class="text-lg font-bold my-2"> {{ t(getTitle.value) }} </div>
      </template> -->
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.widgetType.action.add') }}
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('common.search.searchText')"
            allow-clear
            @change="reload"
            style="width: 240px"
          >
            <template #suffix>
              <Icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
        </div>
      </template>
      <template #firstColumn="{ record }">
        <a @click="handleDetail({ id: record.id })" :title="record.title">
          {{ record.name }}
        </a>
      </template>
      <template #isSystem="{ record }">
        <Checkbox :checked="isEqual(SYS_TENANT_ID, record.tenantId)" />
      </template>
      <template #deprecated="{ record }">
        <Checkbox :checked="record.deprecate" />
      </template>
      <template #bundles="{ record }">
        <Tag class="!mr-2 !border-rounded-md" v-for="bundle in record.bundles" :key="bundle.id.id">
          {{ bundle.name }}
        </Tag>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbWidgetTypeList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { getWidgetTypeList, deleteWidgetType } from '/@/api/tb/widgetType';
  import { Checkbox, Tag } from 'ant-design-vue';
  import { isEqual } from 'lodash-es';
  import { SYS_TENANT_ID } from '/#/constant';
  import { WIDGET_TYPE_OPTIONS } from '/@/enums/widgetTypeEnum';
  import { Authority } from '/@/enums/authorityEnum';
  import { usePermission } from '/@/hooks/web/usePermission';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();
  const { hasPermission } = usePermission();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.widgetType.title'),
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.widgetType.table.title'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('tb.widgetsBundle.title'),
      dataIndex: 'bundles',
      key: 'bundles',
      align: 'left',
      width: 300,
      slot: 'bundles',
    },
    {
      title: t('tb.widgetType.table.type'),
      dataIndex: 'widgetType',
      key: 'widgetType',
      align: 'center',
      width: 120,
      format: (text: any) => (text ? WIDGET_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: t('tb.widgetType.table.system'),
      dataIndex: 'tenantId',
      key: 'tenantId',
      width: 80,
      align: 'center',
      slot: 'isSystem',
    },
    {
      title: t('tb.widgetType.table.deprecated'),
      dataIndex: 'deprecated',
      key: 'deprecated',
      width: 80,
      align: 'center',
      slot: 'deprecated',
    },
    {
      title: t('tb.widgetType.table.createdTime'),
      dataIndex: 'createdTime',
      key: 'createdTime',
      format: 'date|YYYY-MM-DD HH:mm:ss',
      sorter: true,
      width: 160,
      align: 'center',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
      {
        icon: 'ant-design:download-outlined',
        title: t('tb.widgetType.action.export'),
        onClick: handleDownload.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        disabled: !!(hasPermission(Authority.TENANT_ADMIN) && isEqual(SYS_TENANT_ID, record.tenantId)),
        title: t('tb.widgetType.action.delete'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: getWidgetTypeList,
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'name', sortOrder: 'ASC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(fetchParam: any) {
    return { ...fetchParam, textSearch: searchParam.textSearch };
  }

  function handleForm(record: Recordable) {
    // openModal(true, record);
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.widgetType.action.deleteConfirm', { name: record.title }),
      content: t('tb.widgetType.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.widgetType.action.deleteText'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteWidgetType(record.id.id);
          showMessage(t('tb.widgetType.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleDownload(record: Recordable) {
    console.log(record);
  }

  function handleSuccess() {
    reload();
  }

  function handleDetail(record: Recordable) {
    // openDrawer(true, record);
  }
</script>
<style lang="less">
  .widget-type-list {
  }
</style>
