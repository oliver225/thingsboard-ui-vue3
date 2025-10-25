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
<script lang="ts" setup name="ViewsTbDeviceForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useUserStore } from '/@/store/modules/user';
  import { saveDevice } from '/@/api/tb/device';
  import { getDeviceProfileName } from '/@/api/tb/deviceProfile';

  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';
  import { GatewaySocketData } from '/@/api/tb/gateways/types';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<GatewaySocketData>({} as GatewaySocketData);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: t('tb.gateway.form.addTitle'),
  }));

  const inputFormSchemas: FormSchema[] = [
    {
      label: t('tb.gateway.form.name'),
      field: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: t('tb.gateway.form.namePlaceholder'),
      },
      required: true,
    },
    {
      label: t('tb.gateway.form.type'),
      field: 'type',
      component: 'Select',
      componentProps: {
        immediate: true,
        mapFn: (item) => {
          return { label: item.name, value: item.name };
        },
        allowClear: true,
        api: getDeviceProfileName,
      },
      required: true,
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as GatewaySocketData;
    await resetFields();

    setFieldsValue({});
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });

      data.additionalInfo = {
        gateway: true,
      };

      await saveDevice({ ...data });
      showMessage(t('tb.gateway.form.addSuccess'));
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
