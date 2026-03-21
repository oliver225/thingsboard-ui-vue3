<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    @ok="handleSubmit"
    width="40%"
    :show-ok-btn="hasPermission(Authority.TENANT_ADMIN)"
  >
    <template #title>
      <Icon :icon="modalTitle.icon" class="pr-1 m-1" />
      <span>{{ modalTitle.value }}</span>
    </template>
    <p class="mb-2">{{ t('选择新仪表板') }}</p>
    <Select v-model:value="selectedDashboardIds" size="large" style="width: 90%" :allow-clear="true" mode="multiple">
      <Select.Option v-for="dashboard in availableDashboards" :key="dashboard.id.id" :value="dashboard.id.id">
        {{ dashboard.title }}
      </Select.Option>
    </Select>
  </BasicModal>
</template>

<script lang="ts" setup name="ViewsTbCustomerAssignToDashboardForm">
  import { computed, ref, unref } from 'vue';
  import { Select } from 'ant-design-vue';
  import { isEmpty } from 'lodash-es';
  import { Customer } from '/@/api/tb/customer';
  import { DashboardInfo, assignDashboardToCustomer, currentTenantDashboardList } from '/@/api/tb/dashboard';
  import { Icon } from '/@/components/Icon';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Authority } from '/@/enums/authorityEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { router } from '/@/router';

  const emit = defineEmits(['success', 'register']);

  const { hasPermission } = usePermission();
  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);

  const currentCustomer = ref<Customer>({} as Customer);
  const availableDashboards = ref<DashboardInfo[]>([]);
  const selectedDashboardIds = ref<string[]>([]);

  const modalTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: t('分配新仪表板'),
  }));

  const tenantDashboardQuery = {
    pageSize: 2147483647,
    page: 0,
    sortProperty: 'title',
    sortOrder: 'ASC',
  } as const;

  const [registerModal, { closeModal, setModalProps }] = useModalInner(async (customer: Customer) => {
    setModalProps({ loading: true });
    try {
      initializeModal(customer);
      await loadAvailableDashboards();
    } finally {
      setModalProps({ loading: false });
    }
  });

  function initializeModal(customer: Customer) {
    currentCustomer.value = customer;
    selectedDashboardIds.value = [];
  }

  async function loadAvailableDashboards() {
    const { data } = await currentTenantDashboardList(tenantDashboardQuery);
    availableDashboards.value = data;
  }

  async function handleSubmit() {
    if (isEmpty(selectedDashboardIds.value)) {
      showMessage(t('请选择仪表板'), 'warning');
      return;
    }

    try {
      setModalProps({ confirmLoading: true });
      await Promise.all(
        selectedDashboardIds.value.map((dashboardId) =>
          assignDashboardToCustomer(currentCustomer.value.id.id, dashboardId),
        ),
      );
      showMessage(t('分配新仪表板成功！'), 'success');
      closeModal();
      emit('success', '');
    } catch (error: any) {
      if (error?.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
