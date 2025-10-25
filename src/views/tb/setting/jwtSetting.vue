<template>
  <Spin :spinning="dataLoading">
    <div class="jwt-setting">
      <div class="text-lg font-bold my-4">{{ t('tb.setting.jwt.title') }}</div>
      <BasicForm @register="registerForm" />
      <div class="footer">
        <Space>
          <a-button @click="fetchData">
            <Icon :icon="'ant-design:reload-outlined'" />
            {{ t('tb.setting.connectivity.reset') }}
          </a-button>
          <a-button :loading="dataLoading" type="primary" @click="handleSubmit">
            <Icon :icon="'ant-design:check-outlined'" />
            {{ t('tb.setting.connectivity.save') }}
          </a-button>
        </Space>
      </div>
    </div>
  </Spin>
</template>
<script lang="ts" setup name="ViewsTbSettingIndexJwtSetting">
  import { ref, onMounted } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { getJwtSetting, saveJwtSetting, JwtSetting } from '/@/api/tb/adminSetting';
  import { Space, Spin } from 'ant-design-vue';

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const record = ref<JwtSetting>({} as JwtSetting);
  const dataLoading = ref(false);

  const inputFormSchemas: FormSchema[] = [
    {
      label: t('tb.setting.jwt.issuerSigningKey'),
      field: 'tokenIssuer',
      component: 'Input',
      componentProps: {
        placeholder: t('tb.setting.jwt.issuerSigningKeyPlaceholder'),
      },
      required: true,
    },
    {
      label: t('tb.setting.jwt.tokenSigningKey'),
      field: 'tokenSigningKey',
      component: 'Input',
      componentProps: {
        placeholder: t('tb.setting.jwt.tokenSigningKeyPlaceholder'),
      },
      required: true,
    },
    {
      label: t('tb.setting.jwt.tokenExpirationTime'),
      field: 'tokenExpirationTime',
      component: 'InputNumber',
      componentProps: {
        min: 10,
        addonAfter: t('tb.setting.jwt.unitSecond'),
      },
      required: true,
    },
    {
      label: t('tb.setting.jwt.refreshTokenExpirationTime'),
      field: 'refreshTokenExpTime',
      component: 'InputNumber',
      componentProps: {
        addonAfter: t('tb.setting.jwt.unitSecond'),
        min: 10,
      },
      required: true,
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
    labelAlign: 'left',
    labelWidth: 180,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  onMounted(() => {
    fetchData();
  });

  async function fetchData() {
    try {
      dataLoading.value = true;
      const result = await getJwtSetting();
      record.value = result;
      await setFieldsValue(record.value);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
    }
  }

  async function handleSubmit() {
    try {
      const data = await validate();
      dataLoading.value = true;
      // console.log('submit', params, data, record);
      const res = await saveJwtSetting({ ...record.value, ...data });
      fetchData();
      showMessage(t('tb.setting.jwt.saveSuccess'));
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
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
