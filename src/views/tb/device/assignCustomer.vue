<template>
  <BasicModal v-bind="$attrs" @register="registerModal" @ok="handleSubmit" width="40%"
    :show-ok-btn="hasPermission(Authority.TENANT_ADMIN)">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <p class="mb-2">请选择客户分配设备</p>
    <Select v-model:value="customerId" size="large" style="width: 90%;" :allow-clear="true">
      <Select.Option v-for="(customer, index) in customerListData" :key="index" :value="customer.id.id">
        {{ customer.title }}
      </Select.Option>
    </Select>

  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbDeviceAssignToCustomerForm">
import { ref, unref, computed } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { router } from '/@/router';
import { Icon } from '/@/components/Icon';
import { useMessage } from '/@/hooks/web/useMessage';
import { Select } from 'ant-design-vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { DeviceInfo, assignDeviceToCustomer } from '/@/api/tb/device';
import { customerList, Customer } from '/@/api/tb/customer';
import { isEmpty } from 'lodash-es';
import { usePermission } from '/@/hooks/web/usePermission';
import { useUserStore } from '/@/store/modules/user';
import { Authority } from '/@/enums/authorityEnum';



const emit = defineEmits(['success', 'register']);
const { hasPermission } = usePermission();
const userStore = useUserStore();

const { t } = useI18n('tb');
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const deviceInfo = ref<DeviceInfo>({} as DeviceInfo);
const customerListData = ref<Customer[]>([]);
const getTitle = computed(() => ({
  icon: meta.icon || 'ant-design:book-outlined',
  value: t('将设备分配给客户'),
}));

const customerId = ref('');




const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  setModalProps({ loading: true });
  customerId.value = '';
  deviceInfo.value = data;
  const customerResult = await customerList({ pageSize: 2147483647, page: 0, sortProperty: 'title', sortOrder: 'ASC' });
  customerListData.value = customerResult.data;
  setModalProps({ loading: false });
});


async function handleSubmit() {
  if (isEmpty(customerId.value)) {
    showMessage(t('请选择客户！'));
    return;
  }
  try {
    setModalProps({ confirmLoading: true });
    const res = await assignDeviceToCustomer(customerId.value, deviceInfo.value.id.id);
    showMessage(`为设备分配客户成功！`);
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
