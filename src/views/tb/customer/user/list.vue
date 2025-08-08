<template>
  <div class="customer-user-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2"> {{ t(getTitle.value) }} ( {{ customer.title }}) </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})"> <Icon icon="i-fluent:add-12-filled" /> 新增用户 </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
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
        <a @click="handleDetail({ id: record.id })" :title="record.email">
          {{ record.email }}
        </a>
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
    <DetailDrawer @register="registerDrawer" @edit="handleForm" @delete="handleDelete" @login="handleLoginUser" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbCustomerUserList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, ref } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { useDrawer } from '/@/components/Drawer';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { router } from '/@/router';
  import { getCustomerById, Customer } from '/@/api/tb/customer';
  import { getCustomerUsers, deleteUser, getUserToken, getUserById } from '/@/api/tb/user';
  import { reactive } from 'vue';
  import InputForm from './form.vue';
  import DetailDrawer from './detail.vue';
  import { isEmpty } from '/@/utils/is';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';

  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { createConfirm, showMessage, notification } = useMessage();

  const getTitle = {
    value: router.currentRoute.value.meta.title || '客户用户',
  };

  const customer = ref<Customer>({} as Customer);

  const searchParam = reactive({
    textSearch: '',
  });
  const tableColumns: BasicColumn[] = [
    {
      title: t('电子邮件'),
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: '姓名',
      dataIndex: 'firstName',
      width: 230,
      key: 'firstName',
    },
    {
      title: '职务',
      dataIndex: 'lastName',
      key: 'lastName',
      width: 230,
    },
    {
      title: '手机号码',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: '描述信息',
      dataIndex: 'additionalInfo.description',
      key: 'additionalInfo.description',
      ellipsis: true,
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
        icon: 'ant-design:login-outlined',
        title: t('以用户身份登录'),
        onClick: handleLoginUser.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除用户'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: fetchData,
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

  async function fetchData(params: any) {
    const customerId = router.currentRoute.value.params.customerId as string;
    if (isEmpty(customerId)) {
      return Promise.reject(new Error('客户为空！'));
    }
    return getCustomerById(customerId).then((res) => {
      customer.value = res;
      return getCustomerUsers(params, customerId);
    });
  }

  async function handleLoginUser(record: Recordable) {
    try {
      const jwtPair = await getUserToken(record.id.id);
      userStore.setToken(jwtPair);
      userStore.setSessionTimeout(false);

      const userInfo = await getUserById(record.id.id);

      await userStore.afterLoginAction(userInfo, true);

      if (userInfo) {
        notification.success({
          message: t('sys.login.loginSuccessTitle'),
          description: `${t('sys.login.loginSuccessDesc')}: ${userInfo.firstName || userInfo.email}`,
          duration: 3,
        });
      }
    } catch (error: any) {
      showMessage(error.message, 'error');
    } finally {
      location.reload();
    }
  }

  function handleForm(record: Recordable) {
    openModal(true, {
      ...record,
      authority: Authority.CUSTOMER_USER,
      customerId: customer.value.id,
      tenantId: customer.value.tenantId,
    });
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: `确定删除用户[${record.name}]吗？`,
      content: '请注意：确认后，用户和所有相关数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteUser(record.id.id);
          showMessage('删除用户成功！');
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

  function handleDetail(record: Recordable) {
    openDrawer(true, record);
  }
</script>
<style lang="less">
  .customer-user-list {
  }
</style>
