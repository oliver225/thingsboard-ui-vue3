<template>
  <Spin :spinning="dataLoading">
    <div class="sms-setting">
      <div class="text-lg font-bold my-4">短信服务商配置</div>
      <BasicForm @register="registerForm">
       
      </BasicForm>
      <div class="footer">
        <Space>
          <a-button @click="fetchData">
            <Icon :icon="'ant-design:reload-outlined'" />
            重置
          </a-button>
          <a-button :loading="dataLoading" type="primary" @click="handleSubmit">
            <Icon :icon="'ant-design:check-outlined'" />
            保存
          </a-button>
        </Space>
      </div>
    </div>
  </Spin>
</template>
<script lang="ts" setup name="SmsSetting">
import { ref, unref, onMounted } from 'vue';
import { Icon } from '/@/components/Icon';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { getAdminSetting, saveAdminSetting, AdminSetting } from '/@/api/things/adminSetting';
import {  Space, Spin } from 'ant-design-vue';

const { t } = useI18n('things');
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const record = ref<AdminSetting>({} as AdminSetting);
const dataLoading = ref(false);

const inputFormSchemas: FormSchema[] = [
  ];

const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
  labelAlign: 'left',
  labelWidth: 120,
  schemas: inputFormSchemas,
  baseColProps: { lg: 12, md: 24 },

});

onMounted(() => {
  fetchData();
})

async function fetchData() {
  try {
    dataLoading.value = true;
    const result = await getAdminSetting('sms');
    record.value = result
    await setFieldsValue(record.value);
  } catch (error: any) {
    if (error && error.errorFields) {
      showMessage(t('common.validateError'));
    }
    console.log('error', error);
  } finally {
    dataLoading.value = false;
  }
};

async function handleSubmit() {
  try {
    const data = await validate();
    dataLoading.value = true;
    // console.log('submit', params, data, record);
    const res = await saveAdminSetting({ ...record.value, ...data });
    fetchData();
    showMessage('保存通用配置成功！');
  } catch (error: any) {
    if (error && error.errorFields) {
      showMessage(t('common.validateError'));
    }
    console.log('error', error);
  } finally {
    dataLoading.value = true;
  }
}



</script>
<style lang="less">
.sms-setting {
  padding: 6px 46px 24px 24px;

  .footer {
    margin-top: 42px;
  }

}
</style>