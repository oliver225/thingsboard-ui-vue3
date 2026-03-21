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
    <p class="mb-2">{{ t('选择新设备') }}</p>
    <Select v-model:value="selectedDeviceIds" size="large" style="width: 90%" :allow-clear="true" mode="multiple">
      <Select.Option v-for="device in availableDevices" :key="device.id.id" :value="device.id.id">
        {{ device.name }}
      </Select.Option>
    </Select>
  </BasicModal>
</template>

<script lang="ts" setup name="ViewsTbCustomerAssignToDevicerForm">
  import { computed, ref, unref } from 'vue';
  import { Select } from 'ant-design-vue';
  import { isEmpty } from 'lodash-es';
  import { DeviceInfo, assignDeviceToCustomer, getTenantDeviceInfoList } from '/@/api/tb/device';
  import { Customer } from '/@/api/tb/customer';
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
  const availableDevices = ref<DeviceInfo[]>([]);
  const selectedDeviceIds = ref<string[]>([]);

  const modalTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: t('分配新设备'),
  }));

  const tenantDeviceQuery = {
    pageSize: 2147483647,
    page: 0,
    sortProperty: 'name',
    sortOrder: 'ASC',
  } as const;

  const [registerModal, { closeModal, setModalProps }] = useModalInner(async (customer: Customer) => {
    setModalProps({ loading: true });
    try {
      initializeModal(customer);
      await loadAvailableDevices();
    } finally {
      setModalProps({ loading: false });
    }
  });

  function initializeModal(customer: Customer) {
    currentCustomer.value = customer;
    selectedDeviceIds.value = [];
  }

  async function loadAvailableDevices() {
    const { data } = await getTenantDeviceInfoList(tenantDeviceQuery);
    availableDevices.value = data;
  }

  async function handleSubmit() {
    if (isEmpty(selectedDeviceIds.value)) {
      showMessage(t('请选择设备'), 'warning');
      return;
    }

    try {
      setModalProps({ confirmLoading: true });
      await Promise.all(
        selectedDeviceIds.value.map((deviceId) => assignDeviceToCustomer(currentCustomer.value.id.id, deviceId)),
      );
      showMessage(t('分配新设备成功！'), 'success');
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
