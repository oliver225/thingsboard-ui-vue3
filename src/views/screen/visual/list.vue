<template>
    <div class="screen-visual-list">
      <BasicTable @register="registerTable">
        <template #headerTop>
          <div class="text-lg font-bold my-2">
            {{ t(getTitle.value) }}
          </div>
        </template>
        <template #tableTitle>
          <a-button type="primary" @click="handleForm({})">
              <Icon icon="i-fluent:add-12-filled" /> 新增数据大屏
            </a-button>
          <div class="space-x-2">
            <a-input v-model:value="searchParam.textSearch" placeholder="输入搜索内容" allow-clear @change="reload"
              style="width: 240px;">
              <template #suffix>
                <icon icon="ant-design:search-outlined" />
              </template>
            </a-input>
          </div>
        </template>
        <template #firstColumn="{ record }">
            <Space>
            <div class="h-10 w-10 bg-white flex justify-center">
              <div class="cursor-pointer h-10 w-full content-center">
                 <img :src="record.image" :alt="record.title" class="w-full" />
               </div>
            </div>
            {{ record.title }}
            </Space>
        </template>
        <template #published="{ record }">
            <Tag v-if="record.published == true" color="success">已发布</Tag>
            <Tag v-if="record.published == false" color="warning">未发布</Tag>
        </template>
        <template #itemContainer="{ record }">
          <div class="w-full h-68  bg-slate-100">
            <div class="cursor-pointer h-50 w-full content-center">
              <img
              :src="record.image"
              :alt="record.name"
              class="cursor-pointer w-full"
            />
            </div>
            <div class="px-1">
              <div class="flex justify-between">
                <div>
                  {{ record.title }}
                </div>
              </div>

              </div>
          </div>
          </template>
      </BasicTable>
      <InputForm @register="registerModal" @success="handleSuccess" />
    </div>
  </template>
  <script lang="ts">
  export default defineComponent({
    name: "ViewsScreenVisualList",
  });
  </script>
  <script lang="ts" setup>
  import { defineComponent, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import InputForm from './form.vue';
  import { Space, Tag } from 'ant-design-vue';
  import { currentTenantVisualList, } from '/@/api/screen/visual';
  import { Authority } from '/@/enums/authorityEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
import { openWindow } from '/@/utils';


  
  const { hasPermission } = usePermission();


  
  
  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: '数据大屏',
  };
  
  
  const searchParam = reactive({
    textSearch: '',
  })
  const tableColumns: BasicColumn[] = [
    {
      title: t('名称'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('状态'),
      dataIndex: 'published',
      key: 'published',
      align: 'center',
      width: 100,
      slot: 'published',
      filterMultiple: false,
      filters: [
        { text: '已发布', value: 'true' },
        { text: '未发布', value: 'false' },
      ],
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
  ]
  
  const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
    {
        icon: 'i-clarity:note-edit-line',
        color: 'success',
        title: t('编辑大屏'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleEdit.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除数据大屏'),
      }
    ],
  };
  
  const [registerModal, { openModal }] = useModal();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: currentTenantVisualList,
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });
  
  function wrapFetchParams(param: any) {
  
    return { ...param, textSearch: searchParam.textSearch }
  }
  

  function handleForm(record: Recordable) {
    openModal(true, record);
  }

  function handleEdit(record: Recordable) {
    const url =`/_visual#/chart/home/${record.id.id}`
    openWindow(url, { target:'_blank' } )
  }
  
  function handleSuccess() {
    reload();
  }

  
  </script>
  <style lang="less">
  .screen-visual-list {}
  </style>