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
    <BasicForm @register="registerForm">
      <template #gateway="{ model, field }">
        <Checkbox v-model:checked="model[field]" @change="handleGatewayChange">是否网关</Checkbox>
      </template>
      <template #overwriteActivityTime="{ model, field }">
        <Checkbox v-model:checked="model[field]">覆盖已连接设备的活动时间</Checkbox>
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbDeviceForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { Checkbox } from 'ant-design-vue';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useUserStore } from '/@/store/modules/user';
  import { DeviceInfo, getDeviceById, saveDevice } from '/@/api/tb/device';
  import { deviceProfileList, getDefaultDeviceProfileInfo } from '/@/api/tb/deviceProfile';
  import { customerList } from '/@/api/tb/customer';
  import { isEmpty } from 'lodash-es';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';
  import { NULL_UUID } from '/#/constant';
  import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<DeviceInfo>({} as DeviceInfo);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑设备') : t('新增设备'),
  }));

  const inputFormSchemas: FormSchema[] = [
    { field: 'tenantId', component: 'Input', defaultValue: userStore.getUserInfo.tenantId, show: false },
    { field: 'deviceProfileId.entityType', component: 'Input', defaultValue: EntityType.DEVICE_PROFILE, show: false },
    {
      label: t('设备名称'),
      field: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输设备名称',
      },
      required: true,
    },
    {
      label: t('设备标签'),
      field: 'label',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '设备标签',
      },
    },

    {
      label: t('设备配置'),
      field: 'deviceProfileId.id',
      component: 'Select',
      componentProps: {
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: deviceProfileList,
      },
      required: true,
    },
    {
      label: t('分配客户'),
      field: 'customerId.id',
      component: 'Select',
      componentProps: {
        immediate: true,
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
      field: 'additionalInfo.gateway',
      component: 'Checkbox',
      defaultValue: false,
      slot: 'gateway',
      colProps: { lg: 12, md: 12 },
    },
    {
      field: 'additionalInfo.overwriteActivityTime',
      component: 'Checkbox',
      defaultValue: false,
      slot: 'overwriteActivityTime',
      ifShow: false,
      colProps: { lg: 12, md: 12 },
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
    record.value = { ...data } as DeviceInfo;
    await resetFields();
    if (data?.id?.id) {
      const res = await getDeviceById(data.id.id);
      record.value = (res || {}) as DeviceInfo;
    }
    if (isEmpty(record.value.deviceProfileId?.id)) {
      record.value.deviceProfileId = (await getDefaultDeviceProfileInfo()).id;
    }
    if (record.value.customerId?.id && record.value.customerId.id == NULL_UUID) {
      record.value.customerId = undefined;
    }
    await handleGatewayChange({ target: { checked: record.value?.additionalInfo?.gateway || false } });

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

      const res = await saveDevice({ ...data, id: record.value.id });
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}设备成功！`);
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

  async function handleGatewayChange({ target: { checked } }) {
    await updateSchema({
      field: 'additionalInfo.overwriteActivityTime',
      component: 'Checkbox',
      defaultValue: false,
      slot: 'overwriteActivityTime',
      ifShow: checked,
      colProps: { lg: 12, md: 12 },
    });
  }
</script>
