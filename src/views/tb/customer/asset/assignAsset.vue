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
    <Select v-model:value="selectedAssetIds" size="large" style="width: 90%" :allow-clear="true" mode="multiple">
      <Select.Option v-for="asset in availableAssets" :key="asset.id.id" :value="asset.id.id">
        {{ asset.name }}
      </Select.Option>
    </Select>
  </BasicModal>
</template>

<script lang="ts" setup name="ViewsTbCustomerAssignToAssetForm">
  import { computed, ref, unref } from 'vue';
  import { Select } from 'ant-design-vue';
  import { isEmpty } from 'lodash-es';
  import { AssetInfo, assignAssetToCustomer, getTenantAssetInfoList } from '/@/api/tb/asset';
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
  const availableAssets = ref<AssetInfo[]>([]);
  const selectedAssetIds = ref<string[]>([]);

  const modalTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: t('分配新资产'),
  }));

  const tenantAssetQuery = {
    pageSize: 2147483647,
    page: 0,
    sortProperty: 'name',
    sortOrder: 'ASC',
  } as const;

  const [registerModal, { closeModal, setModalProps }] = useModalInner(async (customer: Customer) => {
    setModalProps({ loading: true });
    try {
      initializeModal(customer);
      await loadAvailableAssets();
    } finally {
      setModalProps({ loading: false });
    }
  });

  function initializeModal(customer: Customer) {
    currentCustomer.value = customer;
    selectedAssetIds.value = [];
  }

  async function loadAvailableAssets() {
    const { data } = await getTenantAssetInfoList(tenantAssetQuery);
    availableAssets.value = data;
  }

  async function handleSubmit() {
    if (isEmpty(selectedAssetIds.value)) {
      showMessage(t('请选择资产'), 'warning');
      return;
    }

    try {
      setModalProps({ confirmLoading: true });
      await Promise.all(
        selectedAssetIds.value.map((assetId) => assignAssetToCustomer(currentCustomer.value.id.id, assetId)),
      );
      showMessage(t('分配新资产成功！'), 'success');
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
