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
    <BasicForm @register="registerForm"> </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsScreenVisualForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useUserStore } from '/@/store/modules/user';
  import {
    getTbVisualInfoById,
    createTbVisual,
    saveTbVisual,
    TbVisualInfo,
  } from '/@/api/screen/visual';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<TbVisualInfo>({} as TbVisualInfo);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑数据大屏') : t('新增数据大屏'),
  }));

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'tenantId',
      component: 'Input',
      defaultValue: userStore.getUserInfo.tenantId,
      show: false,
    },
    {
      label: t('大屏名称'),
      field: 'title',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输大屏名称',
      },
      required: true,
    },
    {
      label: t('访问密钥'),
      field: 'credentials',
      component: 'Input',
      ifShow: () => !!record.value.id?.id,
      componentProps: {
        maxlength: 100,
        placeholder: '请输大屏访问密钥',
      },
      rules: [
        { required: false },
        { max: 10, message: t('请输入长度在 10 个字符之内') },
        { pattern: /^[a-zA-Z0-9]*$/, message: t('请输入字母和数字') },
      ],
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
    await resetFields();
    record.value = { ...data } as TbVisualInfo;
    if (data?.id?.id) {
      const res = await getTbVisualInfoById(data.id.id);
      record.value = (res || {}) as TbVisualInfo;
    }
    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });
      // console.log('submit', params, data, record);

      if (record.value?.id?.id) {
        const res = await saveTbVisual({ ...record.value, ...data, id: record.value.id });
      } else {
        const res = await createTbVisual({ ...data });
      }
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}设备大屏成功！`);
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
