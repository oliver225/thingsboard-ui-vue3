<template>
  <Spin :spinning="dataLoading">
    <div class="general-setting">
      <div class="text-lg font-bold my-4">发送邮件配置</div>
      <BasicForm @register="registerForm">
        <template #enableTls="{ model, field }">
          <div class="flex items-center">
            <Switch v-model:checked="model[field]" size="small" @change="handleTLSEnableChange" />
            <span class="ml-4">启用TLS</span>
          </div>
        </template>
        <template #enableProxy="{ model, field }">
          <div class="flex items-center">
            <Switch v-model:checked="model[field]" size="small" @change="handleProxyEnableChange" />
            <span class="ml-4">启用代理</span>
          </div>
        </template>
      </BasicForm>
      <div class="footer">
        <Space>
          <a-button @click="fetchData">
            <Icon :icon="'ant-design:reload-outlined'" />
            重置
          </a-button>
          <a-button :loading="dataLoading" @click="handleSendTestMail">
            <Icon :icon="'ant-design:send-outlined'" />
            发送测试邮件
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
<script lang="ts" setup name="MailSetting">
import { ref, unref, onMounted } from 'vue';
import { Icon } from '/@/components/Icon';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { getAdminSetting, saveAdminSetting, sendTestMail, AdminSetting } from '/@/api/things/adminSetting';
import { Space, Spin, Switch } from 'ant-design-vue';

const { t } = useI18n('things');
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const record = ref<AdminSetting>({} as AdminSetting);
const dataLoading = ref(false);

const inputFormSchemas: FormSchema[] = [
  {
    label: t('邮件来自'),
    field: 'jsonValue.mailFrom',
    component: 'Input',
    componentProps: {
      maxlength: 200,
      placeholder: t('请输入邮箱'),
    },
    required: true,
    colProps: { lg: 24, md: 24 },
  }, {
    label: t('SMTP协议'),
    field: 'jsonValue.smtpProtocol',
    component: 'Select',
    defaultValue: 'smtp',
    componentProps: {
      options: [{ label: 'SMTP', value: 'smtp' }, { label: 'SMTPS', value: 'smtps' }],
    },
    required: true,
    colProps: { lg: 24, md: 24 },
  }, {
    label: t('SMTP主机'),
    field: 'jsonValue.smtpHost',
    component: 'Input',
    componentProps: {
      maxlength: 200,
      placeholder: t('请输入SMTP主机'),
      style: 'width: calc(90% )'
    },
    required: true,
    colProps: { lg: 18, md: 18 },
  }, {
    label: t('SMTP端口'),
    field: 'jsonValue.smtpPort',
    component: 'InputNumber',
    defaultValue: 25,
    componentProps: {
      min: 1,
      placeholder: t('SMTP端口号码'),
    },
    required: true,
    colProps: { lg: 6, md: 6 },
  }, {
    label: t('超时时间'),
    field: 'jsonValue.timeout',
    component: 'InputNumber',
    defaultValue: 10000,
    componentProps: {
      min: 0,
      addonAfter: '毫秒',
      style: 'width: calc(100% )',
      placeholder: t('请输入超时时间'),
    },
    required: true,
    colProps: { lg: 24, md: 24 },
  }, {
    label: t('用户名称'),
    field: 'jsonValue.username',
    component: 'Input',
    componentProps: {
      placeholder: t('请输入用户名称'),
      style: 'width: calc(90% )'
    },
    required: true,
  }, {
    label: t('用户密码'),
    helpMessage: '密码不会显示出来，需要手动修改！',
    field: 'jsonValue.password',
    component: 'InputPassword',
    componentProps: {
      placeholder: t('密码默认不显示'),
    },
  }, {
    field: 'jsonValue.enableTls',
    defaultValue: false,
    component: 'Switch',
    slot: 'enableTls',
    colProps: { lg: 24, md: 24 },
  }, {
    label: t('TLS版本'),
    field: 'jsonValue.tlsVersion',
    component: 'Select',
    defaultValue: 'TLSv1',
    componentProps: {
      options: [
        { label: 'TLSv1', value: 'TLSv1' },
        { label: 'TLSv1.1', value: 'TLSv1.1' },
        { label: 'TLSv1.2', value: 'TLSv1.2' },
        { label: 'TLSv1.3', value: 'TLSv1.3' }
      ]
    },
    required: true,
    show: false,
    colProps: { lg: 24, md: 24 },
  }, {
    field: 'jsonValue.enableProxy',
    defaultValue: false,
    component: 'Switch',
    slot: 'enableProxy',
    colProps: { lg: 24, md: 24 },
  }, {
    label: t('代理主机'),
    field: 'jsonValue.proxyHost',
    component: 'Input',
    componentProps: {
      maxlength: 200,
      placeholder: t('请输入代理主机'),
      style: 'width: calc(90% )'
    },
    required: true,
    show: false,
    colProps: { lg: 18, md: 18 },
  }, {
    label: t('代理端口'),
    field: 'jsonValue.proxyPort',
    component: 'InputNumber',
    componentProps: {
      min: 1,
      placeholder: t('SMTP代理端口'),
    },
    required: true,
    show: false,
    colProps: { lg: 6, md: 6 },
  }, {
    label: t('代理用户'),
    field: 'jsonValue.proxyUser',
    component: 'Input',
    componentProps: {
      placeholder: t('请输入代理用户'),
      style: 'width: calc(90% )'
    },
    show: false,
    required: true,
  }, {
    label: t('代理密码'),
    field: 'jsonValue.proxyPassword',
    component: 'InputPassword',
    show: false,
  }];

const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
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
    const result = await getAdminSetting('mail');
    record.value = result
    handleTLSEnableChange(result?.jsonValue?.enableTls || false);
    handleProxyEnableChange(result?.jsonValue?.enableProxy || false);
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
    showMessage('保存发送邮件配置成功！');
  } catch (error: any) {
    if (error && error.errorFields) {
      showMessage(t('common.validateError'));
    }
    console.log('error', error);
  } finally {
    dataLoading.value = true;
  }
}

async function handleSendTestMail() {
  try {
    const data = await validate();

    dataLoading.value = true;

    const result = await sendTestMail({ ...record.value, ...data });
    showMessage('发送测试邮件成功！');
  } catch (error: any) {
    if (error && error.errorFields) {
      showMessage(t('common.validateError'));
    }
    console.log('error', error);
  } finally {
    dataLoading.value = false;
  }
}

function handleTLSEnableChange(tlsEnabled: boolean) {
  updateSchema([
    {
      field: 'jsonValue.tlsVersion',
      show: tlsEnabled,
    }
  ])
}

function handleProxyEnableChange(proxyEnabled: boolean) {
  updateSchema([
    {
      field: 'jsonValue.proxyHost',
      show: proxyEnabled,
    }, {
      field: 'jsonValue.proxyPort',
      show: proxyEnabled,
    }, {
      field: 'jsonValue.proxyUser',
      show: proxyEnabled,
    }, {
      field: 'jsonValue.proxyPassword',
      show: proxyEnabled,
    }
  ])
}



</script>
<style lang="less">
.general-setting {
  padding: 6px 46px 24px 24px;

  .footer {
    margin-top: 42px;
  }

}
</style>