<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    @ok="handleSubmit"
    width="40%"
    :show-ok-btn="hasPermission(Authority.TENANT_ADMIN)"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <p class="mb-2">{{ t('选择客户分配仪表板') }}</p>
    <Select
      v-model:value="customerIds"
      size="large"
      style="width: 90%"
      :allowClear="true"
      mode="multiple"
      :placeholder="t('选择客户分配仪表板')"
      max-tag-count="responsive"
    >
      <Select.Option
        v-for="(customer, index) in customerListData"
        :key="customer.id.id || index"
        :value="customer.id.id"
      >
        {{ customer.title }}
      </Select.Option>
    </Select>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbDashboardAssignToCustomerForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Select } from 'ant-design-vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { DashboardInfo, updateDashboardCustomers, getDashboardInfoById } from '/@/api/tb/dashboard';
  import { customerList, Customer } from '/@/api/tb/customer';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';

  const emit = defineEmits(['success', 'register']);
  const { hasPermission } = usePermission();

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const dashboardInfo = ref<DashboardInfo>({} as DashboardInfo);
  const customerListData = ref<Customer[]>([]);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: t('分配客户'),
  }));

  // 多选客户 ID 数组
  const customerIds = ref<string[]>([]);

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    dashboardInfo.value = await getDashboardInfoById(data.id.id);
    // 预填：当前仪表板已分配客户列表（如果后端返回 assignedCustomers）
    customerIds.value = Array.isArray(dashboardInfo.value.assignedCustomers)
      ? dashboardInfo.value.assignedCustomers.map((c) => c.customerId?.id).filter((id): id is string => !!id)
      : [];
    const customerResult = await customerList({
      pageSize: 2147483647,
      page: 0,
      sortProperty: 'title',
      sortOrder: 'ASC',
    });
    customerListData.value = customerResult.data;
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      setModalProps({ confirmLoading: true });
      const res = await updateDashboardCustomers(dashboardInfo.value.id.id, customerIds.value);
      showMessage(t('为客户分配仪表板成功'));
      setTimeout(closeModal);
      emit('success', res);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
