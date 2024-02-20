<template>
  <Spin :spinning="dataLoading">
    <div class="jwt-setting">
      <div class="text-lg font-bold my-4">JWT 配置</div>
      <BasicForm @register="registerForm">
        <template #prohibitDifferentUrl="{ model, field }">
          <Checkbox v-model:checked="model[field]">
            禁止从客户端请求头中使用主机名
          </Checkbox>
          <p class="text-help" style="margin-left: 24px;">应为生产环境启用此设置。禁用时可能会导致安全问题</p>
        </template>
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
<script lang="ts" setup name="JwtSetting">
import { ref, onMounted } from 'vue';
import { Icon } from '/@/components/Icon';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { getJwtSetting, saveJwtSetting, JwtSetting } from '/@/api/things/adminSetting';
import { Checkbox, Space, Spin } from 'ant-design-vue';

const { t } = useI18n('things');
const { showMessage } = useMessage();
const record = ref<JwtSetting>({} as JwtSetting);
const dataLoading = ref(false);

const inputFormSchemas: FormSchema[] = [
  {
    label: t('Issuer name'),
    field: 'tokenIssuer',
    component: 'Input',
    componentProps: {
      placeholder: t('请输入tokenIssuer'),
      style: 'width: calc(90% )'
    },
    required: true,

  }, {
    label: t('Signing key'),
    field: 'tokenSigningKey',
    component: 'Input',
    componentProps: {
      placeholder: t('请输入tokenSigningKe'),
    },
    required: true,

  }, {
    label: t('Token 过期时间'),
    field: 'tokenExpirationTime',
    component: 'InputNumber',
    componentProps: {
      min: 10,
      style: 'width: calc(90% )',
      addonAfter: "秒",
    },
    required: true,
  }, {
    label: t('Token 刷新时间'),
    field: 'refreshTokenExpTime',
    component: 'InputNumber',
    componentProps: {
      addonAfter: "秒",
      min: 10,
      style: 'width: calc(100% )',
    },
    required: true,
  }];

const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
  labelAlign: 'left',
  labelWidth: 180,
  schemas: inputFormSchemas,
  baseColProps: { lg: 12, md: 24 },

});

onMounted(() => {
  fetchData();
})

async function fetchData() {
  try {
    dataLoading.value = true;
    const result = await getJwtSetting();
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
    const res = await saveJwtSetting({ ...record.value, ...data });
    fetchData();
    showMessage('保存JWT配置成功！');
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
.jwt-setting {
  padding: 6px 46px 24px 24px;

  .footer {
    margin-top: 42px;
  }

}
</style>