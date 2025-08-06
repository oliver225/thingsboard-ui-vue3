<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    @register="registerModal"
    @ok="handleSubmit"
    width="40%"
    :show-ok-btn="hasPermission(Authority.TENANT_ADMIN)"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbAssetForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { usePermission } from '/@/hooks/web/usePermission';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useUserStore } from '/@/store/modules/user';
  import { AssetInfo, getAssetById, saveAsset } from '/@/api/tb/asset';
  import { assetProfileList, getDefaultAssetProfileInfo } from '/@/api/tb/assetProfile';
  import { customerList } from '/@/api/tb/customer';
  import { isEmpty } from 'lodash-es';
  import { Authority } from '/@/enums/authorityEnum';
  import { NULL_UUID } from '/#/constant';
  import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<AssetInfo>({} as AssetInfo);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑资产') : t('新增资产'),
  }));

  const inputFormSchemas: FormSchema[] = [
    { field: 'tenantId', component: 'Input', defaultValue: userStore.getUserInfo.tenantId, show: false },
    { field: 'assetProfileId.entityType', component: 'Input', defaultValue: EntityType.DEVICE_PROFILE, show: false },
    {
      label: t('资产名称'),
      field: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输资产名称',
      },
      required: true,
    },
    {
      label: t('资产标签'),
      field: 'label',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '资产标签',
      },
    },
    {
      label: t('资产配置'),
      field: 'assetProfileId.id',
      component: 'Select',
      componentProps: {
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: assetProfileList,
      },
      required: true,
    },
    {
      label: t('分配客户'),
      field: 'customerId.id',
      component: 'Select',
      componentProps: {
        immediate: false,
        allowClear: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'title', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.title, value: item.id.id };
        },
        api: customerList,
      },
    },
    {
      label: t('描述信息'),
      field: 'additionalInfo.description',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as AssetInfo;
    await resetFields();
    if (data?.id?.id) {
      const res = await getAssetById(data.id.id);
      record.value = (res || {}) as AssetInfo;
    }
    if (isEmpty(record.value.assetProfileId?.id)) {
      record.value.assetProfileId = (await getDefaultAssetProfileInfo()).id;
    }
    if (record.value.customerId?.id && record.value.customerId.id == NULL_UUID) {
      record.value.customerId = undefined;
    }

    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });
      // console.log('submit', params, data, record);
      data.customerId = isEmpty(data.customerId.id)
        ? null
        : { entityType: EntityType.CUSTOMER, id: data.customerId.id };

      const res = await saveAsset({ ...data, id: record.value.id });
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}资产成功！`);
      setTimeout(closeModal);
      emit('success', data);
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
