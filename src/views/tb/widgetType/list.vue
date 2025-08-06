<template>
  <div class="widget-type-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2"> {{ t(getTitle.value) }} </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})"> <Icon icon="i-fluent:add-12-filled" /> 新增部件 </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
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
  import { Checkbox } from 'ant-design-vue';
  import { isEqual } from 'lodash-es';
  import { SYS_TENANT_ID } from '/#/constant';
  import { WIDGET_TYPE_OPTIONS } from '/@/enums/widgetTypeEnum';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || '部件',
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('标题'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: '部件类型',
      dataIndex: 'widgetType',
      key: 'widgetType',
      align: 'center',
      width: 180,
      format: (text: any) => (text ? WIDGET_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : ''),
    },
    {
      title: '系统',
      dataIndex: 'tenantId',
      key: 'tenantId',
      width: 80,
      align: 'center',
      slot: 'isSystem',
    },
    {
      title: '过时的',
      dataIndex: 'deprecated',
      key: 'deprecated',
      width: 80,
      align: 'center',
      slot: 'deprecated',
    },
    {
      title: t('创建时间'),
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
        title: t('导出部件包'),
        onClick: handleDownload.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除部件包'),
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
      title: `确定删除部件[${record.title}]吗？`,
      content: '请注意：确认后，部件和所有相关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteWidgetType(record.id.id);
          showMessage('删除部件成功！');
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
