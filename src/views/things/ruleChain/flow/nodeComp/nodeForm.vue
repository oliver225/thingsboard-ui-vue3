<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="40%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm">

    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="RuleChainNodeDataForm">
import { ref, unref, computed, } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { Icon } from '/@/components/Icon';
import { useUserStore } from '/@/store/modules/user';

import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { BasicModal, useModalInner } from '/@/components/Modal';

const emit = defineEmits(['success', 'register']);

const { t } = useI18n('things');
const userStore = useUserStore();
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const getTitle = computed(() => ({
  icon: meta.icon || 'ant-design:book-outlined',
  value: t('编辑规则节点数据'),
}));



const inputFormSchemas: FormSchema[] = [
  { field: 'type', component: 'Input', defaultValue: 'CORE', show: false },
  { field: 'tenantId', component: 'Input', defaultValue: userStore.getUserInfo?.tenantId, show: false },
  {
    label: t('规则链名称'),
    field: 'name',
    component: 'Input',
    componentProps: {
      maxlength: 100,
      placeholder: '请输入规则链名称',
    },
    required: true,
  },
  {
    field: 'debugMode',
    component: 'Checkbox',
    defaultValue: false,
    slot: 'debugMode'
  },
  {
    label: t('描 述 信 息'),
    field: 'additionalInfo.description',
    component: 'InputTextArea',
    componentProps: {
      maxlength: 500,
    },
  },
];

const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
  labelWidth: 120,
  schemas: inputFormSchemas,
  baseColProps: { lg: 24, md: 24 },
});

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  setModalProps({ loading: true });
  await resetFields();

  console.log('编辑规则节点', data)

  setModalProps({ loading: false });
});

async function handleSubmit() {
  try {
    const data = await validate();
    setModalProps({ confirmLoading: true });

    // console.log('submit', params, data, record);
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
