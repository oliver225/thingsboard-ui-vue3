<template>
  <ScrollContainer :style="{ maxHeight: domHeight + 'px' }">
    <Spin :spinning="dataLoading">
      <div class="general-setting">
        <div class="text-lg font-bold my-4">发送邮件配置</div>
        <Form ref="formRef" :model="formState" layout="vertical">
          <Form.Item label="邮件来自" :name="['jsonValue', 'mailFrom']" :rules="[{ required: true }]">
            <Input v-model:value="formState.jsonValue.mailFrom" />
          </Form.Item>
          <Form.Item label="SMTP供应商" :name="['jsonValue', 'providerId']" :rules="[{ required: true }]">
            <Input v-model:value="formState.jsonValue.providerId" :disabled="true" />
          </Form.Item>
          <CollapseContainer title="连接设置" :canExpan="false" class="border border-solid border-neutral-300 mb-4">
            <div class="px-4">
              <Row :gutter="24">
                <Col :span="24">
                  <Form.Item label="SMTP协议" :name="['jsonValue', 'smtpProtocol']" :rules="[{ required: true }]">
                    <Select v-model:value="formState.jsonValue.smtpProtocol">
                      <Select.Option value="smtp">SMTP</Select.Option>
                      <Select.Option value="smtps">SMTPS</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item label="SMTP主机" :name="['jsonValue', 'smtpHost']" :rules="[{ required: true }]">
                    <Input v-model:value="formState.jsonValue.smtpHost" />
                  </Form.Item>
                </Col>
                <Col :span="12">
                  <Form.Item label="SMTP端口" :name="['jsonValue', 'smtpPort']" :rules="[{ required: true }]">
                    <InputNumber
                      v-model:value="formState.jsonValue.smtpPort"
                      :min="1"
                      :max="65535"
                      style="width: calc(90%)"
                    />
                  </Form.Item>
                </Col>
                <Col :span="24">
                  <Form.Item label="超时时间(毫秒)" :name="['jsonValue', 'timeout']" :rules="[{ required: true }]">
                    <InputNumber
                      v-model:value="formState.jsonValue.timeout"
                      :min="0"
                      addonAfter="毫秒"
                      style="width: calc(90%)"
                    />
                  </Form.Item>
                </Col>
                <Col :span="24">
                  <Form.Item :name="['jsonValue', 'enableTls']">
                    <Switch v-model:checked="formState.jsonValue.enableTls" @change="handleTlsEnableChange" />
                    <span class="ml-2 text-base font-bold"> 启用TLS </span>
                  </Form.Item>
                </Col>
                <Col :span="24" v-if="formState.jsonValue.enableTls == true">
                  <Form.Item :name="['jsonValue', 'tlsVersion']" :rules="[{ required: true }]">
                    <Select v-model:value="formState.jsonValue.tlsVersion">
                      <Select.Option value="TLSv1">TLSv1</Select.Option>
                      <Select.Option value="TLSv1.1">TLSv1.1</Select.Option>
                      <Select.Option value="TLSv1.2">TLSv1.2</Select.Option>
                      <Select.Option value="TLSv1.3">TLSv1.3</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col :span="24">
                  <Form.Item :name="['jsonValue', 'enableProxy']">
                    <Switch v-model:checked="formState.jsonValue.enableProxy" @change="handleProxyEnableChange" />
                    <span class="ml-2 text-base font-bold"> 启用代理 </span>
                  </Form.Item>
                </Col>
                <Col :span="12" v-if="formState.jsonValue.enableProxy == true">
                  <Form.Item label="代理主机" :name="['jsonValue', 'proxyHost']" :rules="[{ required: true }]">
                    <Input v-model:value="formState.jsonValue.proxyHost" />
                  </Form.Item>
                </Col>
                <Col :span="12" v-if="formState.jsonValue.enableProxy == true">
                  <Form.Item label="代理端口" :name="['jsonValue', 'proxyPort']" :rules="[{ required: true }]">
                    <InputNumber
                      v-model:value="formState.jsonValue.proxyPort"
                      :min="1"
                      :max="65535"
                      style="width: calc(90%)"
                    />
                  </Form.Item>
                </Col>
                <Col :span="12" v-if="formState.jsonValue.enableProxy == true">
                  <Form.Item label="代理用户" :name="['jsonValue', 'proxyUser']">
                    <Input v-model:value="formState.jsonValue.proxyUser" />
                  </Form.Item>
                </Col>
                <Col :span="12" v-if="formState.jsonValue.enableProxy == true">
                  <Form.Item label="代理密码" :name="['jsonValue', 'proxyPassword']">
                    <InputPassword v-model:value="formState.jsonValue.proxyPassword" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </CollapseContainer>
          <CollapseContainer title="身份验证" :canExpan="false" class="border border-solid border-neutral-300 mb-4">
            <div class="px-4">
              <Form.Item label="用户名" :name="['jsonValue', 'username']">
                <Input v-model:value="formState.jsonValue.username" />
              </Form.Item>
              <Form.Item label="修改密码" :name="['jsonValue', 'password']">
                <InputPassword v-model:value="formState.jsonValue.password" />
              </Form.Item>
            </div>
          </CollapseContainer>
        </Form>
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
  </ScrollContainer>
</template>
<script lang="ts" setup name="ViewsTbSettingMailSetting">
  import { ref, onMounted, reactive } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { CollapseContainer } from '/@/components/Container';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { getAdminSetting, saveAdminSetting, sendTestMail, AdminSetting } from '/@/api/tb/adminSetting';
  import { Space, Spin, Row, Col, Switch, Input, Form, Select, InputNumber, InputPassword } from 'ant-design-vue';
  import { ScrollContainer } from '/@/components/Container/index';
  import { useWindowSizeFn } from '/@/hooks/event/useWindowSizeFn';
import { EntityType } from '/@/enums/entityTypeEnum';

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const formRef = ref<FormInstance>();
  const record = ref<AdminSetting>({} as AdminSetting);
  const dataLoading = ref(false);

  const domHeight = ref(500);

  const formState = reactive<AdminSetting>({
    tenantId: { entityType: EntityType.TENANT, id: '' },
    key: 'mail',
    jsonValue: {
      mailFrom: '',
      providerId: 'CUSTOM',
      smtpProtocol: 'smtp',
      smtpHost: 'localhost',
      smtpPort: '25',
      timeout: '10000',
      username: '',
      password: '',
      enableTls: false,
      tlsVersion: 'TLSv1',
      enableProxy: false,
      proxyHost: '',
      proxyPort: '',
      proxyUser: '',
      proxyPassword: '',
      enableOauth2: false,
    },
  } as AdminSetting);

  onMounted(() => {
    fetchData();
  });

  async function fetchData() {
    try {
      dataLoading.value = true;
      clear();
      const result = await getAdminSetting('mail');
      record.value = result;
      Object.keys(record.value).forEach((key) => {
        formState[key] = record.value[key];
      });
      formState.jsonValue.providerId = 'CUSTOM';
      // handleTLSEnableChange(result?.jsonValue?.enableTls || false);
      // handleProxyEnableChange(result?.jsonValue?.enableProxy || false);
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
    formState.tenantId = { entityType: EntityType.TENANT, id: '' };
    formState.key = 'mail';
    formState.jsonValue = {
      mailFrom: '',
      providerId: 'CUSTOM',
      smtpProtocol: 'smtp',
      smtpHost: 'localhost',
      smtpPort: '25',
      timeout: '10000',
      username: '',
      password: '',
      enableTls: false,
      tlsVersion: 'TLSv1',
      enableProxy: false,
      proxyHost: '',
      proxyPort: '',
      proxyUser: '',
      proxyPassword: '',
      enableOauth2: false,
    };
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
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
      dataLoading.value = false;
    }
  }

  async function handleSendTestMail() {
    try {
      const data = await formRef.value?.validate();

      dataLoading.value = true;

      const result = await sendTestMail({ ...record.value, ...data });
      showMessage('发送测试邮件成功！');
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'), 'error');
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
    }
  }

  function handleTlsEnableChange(tlsEnable: any) {
    formState.jsonValue.tlsVersion = tlsEnable == true ? 'TLSv1' : undefined;
  }

  function handleProxyEnableChange(proxyEnable: any) {
    formState.jsonValue.proxyHost = proxyEnable == true ? '' : undefined;
    formState.jsonValue.proxyPort = proxyEnable == true ? '25' : undefined;
    formState.jsonValue.proxyUser = proxyEnable == true ? 'sysadmin@thingsboard.org' : undefined;
    formState.jsonValue.proxyPassword = proxyEnable == true ? 'sysadmin' : undefined;
  }

  useWindowSizeFn(computedDomHeight, 280, { immediate: true });

  function computedDomHeight() {
    domHeight.value = document.documentElement.clientHeight - 165;
  }
</script>
<style lang="less">
  .general-setting {
    padding: 6px 46px 24px 24px;
    overflow-y: scroll;

    .footer {
      margin-top: 42px;
    }
  }
</style>
