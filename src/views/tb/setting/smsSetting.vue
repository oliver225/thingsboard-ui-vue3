<template>
  <Spin :spinning="dataLoading">
    <div class="sms-setting">
      <div class="text-lg font-bold my-4">{{ t('tb.setting.sms.title') }}</div>
      <Form ref="formRef" :model="formState" layout="vertical">
        <Form.Item :label="t('tb.setting.sms.provider')" :name="['jsonValue', 'type']" :rules="[{ required: true }]">
          <Select v-model:value="formState.jsonValue.type" :disabled="true">
            <Select.Option value="ALI_SMS">{{ t('tb.setting.sms.providerAliSms') }}</Select.Option>
            <Select.Option value="AWS_SNS">{{ t('tb.setting.sms.providerAwsSns') }}</Select.Option>
            <Select.Option value="TWILIO">{{ t('tb.setting.sms.providerTwilio') }}</Select.Option>
            <Select.Option value="SMPP">{{ t('tb.setting.sms.providerSmpp') }}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          :label="t('tb.setting.sms.accessKeyId')"
          :name="['jsonValue', 'accessKeyId']"
          :rules="[{ required: true }]"
        >
          <Input v-model:value="formState.jsonValue.accessKeyId" />
        </Form.Item>
        <Form.Item
          :label="t('tb.setting.sms.accessKeySecret')"
          :name="['jsonValue', 'accessKeySecret']"
          :rules="[{ required: true }]"
        >
          <InputPassword v-model:value="formState.jsonValue.accessKeySecret" />
        </Form.Item>
        <Form.Item
          :label="t('tb.setting.sms.signName')"
          :name="['jsonValue', 'signName']"
          :rules="[{ required: true }]"
        >
          <Input v-model:value="formState.jsonValue.signName" />
        </Form.Item>
        <Form.Item
          :label="t('tb.setting.sms.templateCode')"
          :name="['jsonValue', 'templateCode']"
          :rules="[{ required: true }]"
        >
          <Input v-model:value="formState.jsonValue.templateCode" />
        </Form.Item>
      </Form>
      <div class="footer">
        <Space>
          <a-button @click="fetchData">
            <Icon :icon="'ant-design:reload-outlined'" />
            {{ t('tb.setting.connectivity.reset') }}
          </a-button>
          <a-button :loading="dataLoading" @click="handleOpenTestSmsModal">
            <Icon :icon="'ant-design:send-outlined'" />
            {{ t('tb.setting.sms.sendTestSms') }}
          </a-button>
          <a-button :loading="dataLoading" type="primary" @click="handleSubmit">
            <Icon :icon="'ant-design:check-outlined'" />
            {{ t('tb.setting.connectivity.save') }}
          </a-button>
        </Space>
      </div>
      <Modal
        v-model:open="showSmsTestModal"
        :centered="true"
        :title="t('tb.setting.sms.sendTestSms')"
        :okText="t('tb.setting.sms.sendTestSms')"
        @ok="handleSendTestSms"
      >
        <Form ref="testFromRef" :model="testSms" layout="vertical">
          <Form.Item
            :label="t('tb.setting.sms.phoneNumber')"
            name="numberTo"
            :rules="[
              { required: true },
              { pattern: /^(1[3-9]\d{9}|09\d{8})$/, message: t('tb.setting.sms.phoneNumberInvalid') },
            ]"
          >
            <Input v-model:value="testSms.numberTo" />
          </Form.Item>
          <Form.Item :label="t('tb.setting.sms.message')" name="message" :rules="[{ required: true }]">
            <Input.TextArea v-model:value="testSms.message" :rows="4" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  </Spin>
</template>
<script lang="ts" setup name="ViewsTbSettingSmsSetting">
  import { ref, onMounted, reactive } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { useUserStore } from '/@/store/modules/user';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { getAdminSetting, saveAdminSetting, AdminSetting } from '/@/api/tb/adminSetting';
  import { sendTestSms } from '/@/api/tb/adminSetting';
  import { Space, Select, Spin, Form, Input, InputPassword, Modal } from 'ant-design-vue';

  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const formRef = ref<FormInstance>();
  const testFromRef = ref<FormInstance>();
  const record = ref<AdminSetting>({} as AdminSetting);
  const dataLoading = ref(false);
  const showSmsTestModal = ref(false);

  const formState = reactive<AdminSetting>({
    tenantId: userStore.getUserInfo.tenantId,
    key: 'sms',
    jsonValue: {
      accessKeyId: '',
      accessKeySecret: '',
      signName: '',
      templateCode: '',
      type: 'ALI_SMS',
    },
  } as AdminSetting);

  const testSms = reactive<any>({
    message: '',
    numberTo: '',
  });

  onMounted(() => {
    fetchData();
  });

  async function fetchData() {
    try {
      dataLoading.value = true;
      clear();
      const result = await getAdminSetting('sms');
      record.value = result;
      Object.keys(record.value).forEach((key) => {
        formState[key] = record.value[key];
      });
      formState.jsonValue.type = 'ALI_SMS';
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
    }
  }

  function clear() {
    formState.tenantId = userStore.getUserInfo.tenantId;
    formState.key = 'sms';
    formState.jsonValue = {
      accessKeyId: '',
      accessKeySecret: '',
      signName: '',
      templateCode: '',
      type: 'ALI_SMS',
    };
    testSms.message = '';
    testSms.numberTo = '';
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      dataLoading.value = true;
      // console.log('submit', params, data, record);
      const res = await saveAdminSetting({ ...record.value, ...data });
      fetchData();
      showMessage(t('tb.setting.sms.saveSuccess'));
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
    }
  }

  async function handleOpenTestSmsModal() {
    try {
      await formRef.value?.validate();
      showSmsTestModal.value = true;
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'), 'error');
      }
      console.log('error', error);
    }
  }
  async function handleSendTestSms() {
    try {
      const provider = await formRef.value?.validate();
      const data = await testFromRef.value?.validate();
      dataLoading.value = true;
      if (provider && data) {
        const result = await sendTestSms({
          numberTo: '+86' + data.numberTo,
          message: data.message,
          providerConfiguration: provider.jsonValue,
        });
        showMessage(t('tb.setting.sms.sendTestSmsSuccess'));
      }
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'), 'error');
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
      showSmsTestModal.value = false;
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
