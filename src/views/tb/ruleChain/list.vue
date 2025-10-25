<template>
  <div class="ruleChain-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.ruleChain.action.add') }}
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
      <template #firstColumn="{ record }">
        <a @click="handleFLow({ id: record.id })" :title="record.name">
          {{ record.name }}
        </a>
      </template>
      <template #debugMode="{ record }">
        <Checkbox :checked="record.debugMode" />
      </template>
      <template #root="{ record }">
        <Checkbox :checked="record.root" />
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbRuleChainList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { Checkbox } from 'ant-design-vue';
  import { ruleChainList, setRootRuleChain, deleteRuleChain } from '/@/api/tb/ruleChain';
  import InputForm from './form.vue';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || t('tb.ruleChain.title'),
  };

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.ruleChain.table.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 260,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('tb.ruleChain.table.description'),
      dataIndex: 'additionalInfo.description',
      key: 'additionalInfo.description',
      align: 'left',
      ellipsis: true,
    },

    {
      title: t('tb.ruleChain.table.debug'),
      dataIndex: 'debugMode',
      key: 'debugMode',
      width: 80,
      align: 'center',
      slot: 'debugMode',
    },
    {
      title: t('tb.ruleChain.table.root'),
      dataIndex: 'root',
      key: 'root',
      width: 80,
      align: 'center',
      slot: 'root',
    },
    {
      title: t('tb.ruleChain.table.createdTime'),
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
        icon: 'ant-design:flag-outlined',
        disabled: record.root == true,
        title: t('tb.ruleChain.action.setRoot'),
        onClick: handleSetRuleChainRoot.bind(this, { ...record }),
      },
      {
        icon: 'i-clarity:note-edit-line',
        color: 'success',
        title: t('tb.ruleChain.action.edit'),
        onClick: handleForm.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.ruleChain.action.delete'),
        disabled: record.root == true,
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: (arg) => ruleChainList(arg, 'CORE'),
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(param: any) {
    return { ...param, textSearch: searchParam.textSearch };
  }

  function handleForm(record: Recordable) {
    openModal(true, record);
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.ruleChain.action.deleteConfirmTitle', { name: record.name }),
      content: t('tb.ruleChain.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.ruleChain.action.delete'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteRuleChain(record.id.id);
          showMessage(t('tb.ruleChain.action.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleSuccess() {
    reload();
  }

  function handleFLow(record: Recordable) {
    router.push({ path: `/rule-chain/${record.id.id}` });
  }

  async function handleSetRuleChainRoot(record: Recordable) {
    createConfirm({
      iconType: 'info',
      title: t('tb.ruleChain.action.setRootConfirmTitle', { name: record.name }),
      content: t('tb.ruleChain.action.setRootConfirmContent'),
      centered: false,
      okText: t('tb.ruleChain.action.confirm'),
      onOk: async () => {
        try {
          await setRootRuleChain(record.id.id);
          showMessage(t('tb.ruleChain.action.setRootSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }
</script>
<style lang="less">
  .ruleChain-list {
  }
</style>
