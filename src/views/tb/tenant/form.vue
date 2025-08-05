<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbTenantForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { TenantInfo, tenantInfoById, tenantSave } from '/@/api/tb/tenant';
  import { tenantProfileInfoList, getTenantProfileInfoDefault } from '/@/api/tb/tenantProfile';
  import { isEmpty } from 'lodash-es';
  import { useCascaderAreaData } from '@vant/area-data';
import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<TenantInfo>({} as TenantInfo);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑租户') : t('新增租户'),
  }));

  const inputFormSchemas: FormSchema[] = [
    {
      label: t('租户名称'),
      field: 'title',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'tenantProfileId.entityType',
      component: 'Input',
      show: false,
      componentProps: {
        value: EntityType.TENANT_PROFILE,
      },
    },
    {
      label: t('租户配置'),
      field: 'tenantProfileId.id',
      component: 'Select',
      componentProps: {
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: tenantProfileInfoList,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('手机号码'),
      field: 'phone',
      component: 'Input',
      required: true,
      rules: [{ required: true }, { pattern: /^1[3-9]\d{9}$/, message: t('请填写正确的手机号码') }],
    },
    {
      label: t('邮政编码'),
      field: 'zip',
      component: 'Input',
    },
    {
      label: t('邮箱地址'),
      field: 'email',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      colProps: { lg: 24, md: 24 },
      rules: [{ type: 'email', message: t('请填写正确的邮箱地址') }],
    },
    {
      label: t('省市区域'),
      field: 'areaList',
      component: 'Cascader',
      componentProps: {
        options: useCascaderAreaData(),
        fieldNames: { label: 'text', value: 'value', children: 'children' },
      },
      rules: [{ required: true, message: t('选择省市区域') }],
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('详细地址'),
      field: 'address',
      component: 'Input',
      componentProps: {
        maxlength: 200,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('备用地址'),
      field: 'address2',
      component: 'Input',
      componentProps: {
        maxlength: 200,
      },
      colProps: { lg: 24, md: 24 },
    },

    {
      label: t('描述信息'),
      field: 'additionalInfo.description',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as TenantInfo;
    await resetFields();
    if (data?.id?.id) {
      const res = await tenantInfoById(data.id.id);
      record.value = (res || {}) as TenantInfo;
      record.value.areaList = [record.value.state, record.value.city, record.value.country];
    }
    if (isEmpty(record.value.tenantProfileId?.id)) {
      const defaultTenantProfile = await getTenantProfileInfoDefault();
      record.value.tenantProfileId = defaultTenantProfile.id;
      record.value.tenantProfileName = defaultTenantProfile.name;
    }

    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });
      data.state = data.areaList[0];
      data.city = data.areaList[1];
      data.country = data.areaList[2];
      // console.log('submit', params, data, record);
      const res = await tenantSave({ ...data, id: record.value.id });
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}租户成功！`);
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
