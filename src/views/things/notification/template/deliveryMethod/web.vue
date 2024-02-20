<template>
  <div class="delivery-method-web">
    <BasicForm @register="registerForm">
      <template #iconEnable="{ model, field }">
        <div class="flex mb-4">
          <Switch v-model:checked="model[field]" @change="handleIconEnableChange" />
          <span class="ml-4">显示图标</span>
        </div>

      </template>
      <template #buttonEnable="{ model, field }">
        <div class="flex mb-4">
          <Switch v-model:checked="model[field]" @change="handleActionButtonEnableChange" />
          <span class="ml-4">显示按钮</span>
        </div>
      </template>
      <template #setEntityIdInState="{ model, field }">
        <Switch v-model:checked="model[field]" size="small" />
        <span class="ml-2">Set entity from notification to dashboard state</span>
      </template>
    </BasicForm>
  </div>
</template>
<script lang="ts" setup name="DeliveryMethodWebForm">
import { currentTenantDashboardList } from '/@/api/things/dashboard';
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { Authority } from '/@/enums/authorityEnum';
import { useI18n } from '/@/hooks/web/useI18n';
import { useUserStore } from '/@/store/modules/user';
import { Switch } from 'ant-design-vue';

const emit = defineEmits(['success', 'register']);
const { t } = useI18n('things');
const userStore = useUserStore();


const inputFormSchemas: FormSchema[] = [
  { field: 'method', component: 'Input', defaultValue: 'WEB', show: false },
  { field: 'enabled', component: 'Checkbox', defaultValue: true, show: false },
  {
    label: t('主题'),
    field: 'subject',
    component: 'Input',
    componentProps: {
      maxlength: 100,
    },
    required: true,
    colProps: { lg: 24, md: 24 },
  },
  {
    label: t('消息'),
    field: 'body',
    component: 'InputTextArea',
    componentProps: {
      maxlength: 200,
    },
    required: true,
    colProps: { lg: 24, md: 24 },
  },
  {
    field: 'additionalConfig.icon.enabled',
    labelWidth: 120,
    component: 'Switch',
    defaultValue: false,
    slot: 'iconEnable',
    colProps: { lg: 24, md: 24 },
  },
  {
    field: 'additionalConfig.icon.icon',
    component: 'IconPicker',
    componentProps: {
      placeholder: '选择图标'
    },
    show: false,
    colProps: { lg: 12, md: 12 },
  },
  {
    field: 'additionalConfig.icon.color',
    component: 'ColorPicker',
    componentProps: {
      placeholder: '选择图标颜色'
    },
    show: false,
    colProps: { lg: 12, md: 12 },
  },
  {
    field: 'additionalConfig.actionButtonConfig.enabled',
    labelWidth: 120,
    defaultValue: false,
    component: 'Switch',
    slot: 'buttonEnable',
    colProps: { lg: 24, md: 24 },
  },
  {
    field: 'additionalConfig.actionButtonConfig.text',
    component: 'Input',
    componentProps: {
      placeholder: '输入按钮文字'
    },
    show: false,
    colProps: { lg: 24, md: 24 },
  },
  {
    field: 'additionalConfig.actionButtonConfig.linkType',
    component: 'Select',
    defaultValue: 'LINK',
    componentProps: {
      options: [{ label: '连接地址', value: 'LINK' }, { label: '仪表盘', value: 'DASHBOARD' }],
      onChange: handleActionButtonLinkTypeChange,
    },
    show: false,
    colProps: { lg: 8, md: 8 },
  },
  {
    field: 'additionalConfig.actionButtonConfig.link',
    component: 'Input',
    componentProps: {
      placeholder: '输入连接地址'
    },
    show: false,
    colProps: { lg: 16, md: 16 },
  },
  {
    field: 'additionalConfig.actionButtonConfig.dashboardId',
    component: 'Select',
    componentProps: {
      immediate: true,
      api: () => fetchDashboardList(),
      placeholder: '选择仪表盘'
    },
    show: false,
    colProps: { lg: 8, md: 8 },
  },
  {
    field: 'additionalConfig.actionButtonConfig.dashboardState',
    component: 'Input',
    componentProps: {
      placeholder: '仪表盘状态'
    },
    show: false,
    colProps: { lg: 8, md: 8 },
  },
  {
    field: 'additionalConfig.actionButtonConfig.setEntityIdInState',
    component: 'Switch',
    colProps: { lg: 24, md: 24 },
    show: false,
    slot: "setEntityIdInState",
  },
]

const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
  layout: 'vertical',
  schemas: inputFormSchemas,
  baseColProps: { lg: 12, md: 24 },
});

function handleIconEnableChange(iconEnabled: boolean) {
  updateSchema([
    {
      field: 'additionalConfig.icon.icon',
      show: iconEnabled,

    }, {
      field: 'additionalConfig.icon.color',
      show: iconEnabled,
    },
  ])
}

function handleActionButtonEnableChange(actionButtonEnabled: boolean) {
  const values = getFieldsValue();
  const linkEnabled = values.additionalConfig.actionButtonConfig.linkType == 'LINK';
  updateSchema([
    {
      field: 'additionalConfig.actionButtonConfig.text',
      show: actionButtonEnabled,
    }, {
      field: 'additionalConfig.actionButtonConfig.linkType',
      show: actionButtonEnabled,
      defaultValue: 'LINK'
    }, {
      field: 'additionalConfig.actionButtonConfig.link',
      show: actionButtonEnabled && linkEnabled,
    }, {
      field: 'additionalConfig.actionButtonConfig.dashboardId',
      show: actionButtonEnabled && !linkEnabled,
    }, {
      field: 'additionalConfig.actionButtonConfig.dashboardState',
      show: actionButtonEnabled && !linkEnabled,
    }, {
      field: 'additionalConfig.actionButtonConfig.setEntityIdInState',
      show: actionButtonEnabled && !linkEnabled,
    },
  ])
}

function handleActionButtonLinkTypeChange(linkType: string) {
  const linkEnabled = linkType == 'LINK';
  updateSchema([
    {
      field: 'additionalConfig.actionButtonConfig.link',
      show: linkEnabled,
    }, {
      field: 'additionalConfig.actionButtonConfig.dashboardId',
      show: !linkEnabled,
    }, {
      field: 'additionalConfig.actionButtonConfig.dashboardState',
      show: !linkEnabled,
    }, {
      field: 'additionalConfig.actionButtonConfig.setEntityIdInState',
      show: !linkEnabled,
    },
  ])

}

async function fetchDashboardList() {
  try {
    if (userStore.getAuthority == Authority.TENANT_ADMIN) {
      const dashboardList = await currentTenantDashboardList({ pageSize: 50, page: 0, sortProperty: 'title', sortOrder: 'ASC' });
      return dashboardList.data.map(item => { return { value: item.id.id, label: item.title } })
    }
    return [];
  } catch (error) {
    console.log('error', error);
    return [];
  }

}

async function setConfigFieldsValue(values: any) {
  await resetFields();
  await setFieldsValue(values);
  handleIconEnableChange(values?.additionalConfig?.icon?.enabled || false);
  handleActionButtonEnableChange(values?.additionalConfig?.actionButtonConfig?.enabled || false);


}

defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue: setConfigFieldsValue })


</script>
<style lang="less">
.delivery-method-web {}
</style>