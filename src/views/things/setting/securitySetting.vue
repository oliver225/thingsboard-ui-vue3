<template>
  <Spin :spinning="dataLoading">
    <div class="security-setting">
      <div class="text-lg font-bold my-4">安全策略</div>
      <BasicForm @register="registerForm">
        <template #allowWhitespaces="{ model, field }">
          <Checkbox v-model:checked="model[field]">
            允许包含空格
          </Checkbox>
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
<script lang="ts" setup name="SecuritySetting">
import { ref, onMounted } from 'vue';
import { Icon } from '/@/components/Icon';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { getSecuritySettings, saveSecuritySettings, SecuritySettings } from '/@/api/things/adminSetting';
import { Checkbox, Space, Spin } from 'ant-design-vue';

const { t } = useI18n('things');
const { showMessage } = useMessage();
const record = ref<SecuritySettings>({} as SecuritySettings);
const dataLoading = ref(false);

const inputFormSchemas: FormSchema[] = [
  {
    label: t('基本策略'),
    field: 'base',
    component: 'FormGroup',
    colProps: { lg: 24, md: 24 },
  },
  {
    label: t('登录失败之前，最大登录尝试次数'),
    field: 'maxFailedLoginAttempts',
    component: 'InputNumber',
    componentProps: {
      min: 1,
    },
    colProps: { lg: 24, md: 24 },

  }, {
    label: t('如果用户帐户锁定，请发送通知到电子邮件'),
    field: 'userLockoutNotificationEmail',
    component: 'Input',
    componentProps: {
      placeholder: t('请输入电子邮件'),
    },
    colProps: { lg: 24, md: 24 },

  }, {
    label: t('密码策略'),
    field: 'base2',
    component: 'FormGroup',
    colProps: { lg: 24, md: 24 },
  }, {
    label: t('最小密码长度'),
    labelWidth: 160,
    field: 'passwordPolicy.minimumLength',
    component: 'InputNumber',
    defaultValue: 6,
    componentProps: {
      min: 1,
      style: 'width: calc(90% )'
    },
    required: true,
  }, {
    labelWidth: 160,
    field: 'passwordPolicy.allowWhitespaces',
    component: 'Checkbox',
    slot: 'allowWhitespaces',
    defaultValue: false,
  }, {
    label: t('最少大写字母位数'),
    labelWidth: 160,
    field: 'passwordPolicy.minimumUppercaseLetters',
    component: 'InputNumber',
    componentProps: {
      min: 0,
      style: 'width: calc(90% )'
    }
  }, {
    label: t('最少小写字母位数'),
    labelWidth: 160,
    field: 'passwordPolicy.minimumLowercaseLetters',
    component: 'InputNumber',
    componentProps: {
      min: 0,
    }
  }, {
    label: t('最少数字位数'),
    labelWidth: 160,
    field: 'passwordPolicy.minimumDigits',
    component: 'InputNumber',
    componentProps: {
      min: 0,
      style: 'width: calc(90% )'
    }
  }, {
    label: t('最少特殊字符位数'),
    labelWidth: 160,
    field: 'passwordPolicy.minimumSpecialCharacters',
    component: 'InputNumber',
    componentProps: {
      min: 0,
    }
  }, {
    label: t('密码有效期'),
    labelWidth: 160,
    field: 'passwordPolicy.passwordExpirationPeriodDays',
    component: 'InputNumber',
    componentProps: {
      addonAfter: "天",
      min: 0,
      style: 'width: calc(90% )'
    }
  }, {
    label: t('密码重用频率'),
    labelWidth: 160,
    field: 'passwordPolicy.passwordReuseFrequencyDays',
    component: 'InputNumber',
    componentProps: {
      addonAfter: "天",
      min: 0,
      style: 'width: calc(100% )'
    }
  }];

const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
  layout: 'vertical',
  schemas: inputFormSchemas,
  baseColProps: { lg: 12, md: 24 },

});

onMounted(() => {
  fetchData();
})

async function fetchData() {
  try {
    dataLoading.value = true;
    const result = await getSecuritySettings();
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
    const res = await saveSecuritySettings({ ...record.value, ...data });
    fetchData();
    showMessage('保存安全策略成功！');
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
.security-setting {
  padding: 6px 46px 24px 24px;

  .footer {
    margin-top: 42px;
  }

}
</style>