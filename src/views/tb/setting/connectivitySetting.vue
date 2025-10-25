<template>
  <Spin :spinning="dataLoading">
    <div class="connectivity-setting">
      <div class="text-lg font-bold my-4">{{ t('tb.setting.connectivity.title') }}</div>
      <Form ref="formRef" :model="formState" layout="vertical">
        <div class="flex flex-col items-center mb-2">
          <Segmented v-model:value="type" size="large" :options="segmentedOptions" />
          <div class="px-40 py-2 my-4 rounded-md bg-neutral-100">
            {{ t('tb.setting.connectivity.defaultProtocolValueTip') }}
          </div>
        </div>

        <div v-show="type == 'HTTP(s)'" class="space-y-6">
          <div class="border border-solid border-neutral-300 rounded-md px-4 py-3">
            <Form.Item :name="['jsonValue', 'http', 'enabled']">
              <Switch size="small" v-model:checked="formState.jsonValue.http.enabled" />
              <span class="ml-2 text-base font-bold"> {{ t('tb.setting.connectivity.http') }} </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.hostAddress')" :name="['jsonValue', 'http', 'host']">
                  <Input
                    v-model:value="formState.jsonValue.http.host"
                    :placeholder="t('tb.setting.connectivity.host')"
                    :disabled="!formState.jsonValue.http.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.portNumber')" :name="['jsonValue', 'http', 'port']">
                  <Input
                    v-model:value="formState.jsonValue.http.port"
                    :placeholder="t('tb.setting.connectivity.port')"
                    :disabled="!formState.jsonValue.http.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <div class="border border-solid border-neutral-300 rounded-md px-4 py-3">
            <Form.Item :name="['jsonValue', 'https', 'enabled']">
              <Switch size="small" v-model:checked="formState.jsonValue.https.enabled" />
              <span class="ml-2 text-base font-bold"> {{ t('tb.setting.connectivity.https') }} </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.hostAddress')" :name="['jsonValue', 'https', 'host']">
                  <Input
                    v-model:value="formState.jsonValue.https.host"
                    :placeholder="t('tb.setting.connectivity.host')"
                    :disabled="!formState.jsonValue.https.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.portNumber')" :name="['jsonValue', 'https', 'port']">
                  <Input
                    v-model:value="formState.jsonValue.https.port"
                    :placeholder="t('tb.setting.connectivity.port')"
                    :disabled="!formState.jsonValue.https.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
        <div v-show="type == 'MQTT(s)'" class="space-y-6">
          <div class="border border-solid border-neutral-300 rounded-md px-4 py-3">
            <Form.Item :name="['jsonValue', 'mqtt', 'enabled']">
              <Switch size="small" v-model:checked="formState.jsonValue.mqtt.enabled" />
              <span class="ml-2 text-base font-bold"> {{ t('tb.setting.connectivity.mqtt') }} </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.hostAddress')" :name="['jsonValue', 'mqtt', 'host']">
                  <Input
                    v-model:value="formState.jsonValue.mqtt.host"
                    :placeholder="t('tb.setting.connectivity.host')"
                    :disabled="!formState.jsonValue.mqtt.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.portNumber')" :name="['jsonValue', 'mqtt', 'port']">
                  <Input
                    v-model:value="formState.jsonValue.mqtt.port"
                    :placeholder="t('tb.setting.connectivity.port')"
                    :disabled="!formState.jsonValue.mqtt.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <div class="border border-solid border-neutral-300 rounded-md px-4 py-3">
            <Form.Item :name="['jsonValue', 'mqtts', 'enabled']">
              <Switch size="small" v-model:checked="formState.jsonValue.mqtts.enabled" />
              <span class="ml-2 text-base font-bold"> {{ t('tb.setting.connectivity.mqtts') }} </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.hostAddress')" :name="['jsonValue', 'mqtts', 'host']">
                  <Input
                    v-model:value="formState.jsonValue.mqtts.host"
                    :placeholder="t('tb.setting.connectivity.host')"
                    :disabled="!formState.jsonValue.mqtts.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.portNumber')" :name="['jsonValue', 'mqtts', 'port']">
                  <Input
                    v-model:value="formState.jsonValue.mqtts.port"
                    :placeholder="t('tb.setting.connectivity.port')"
                    :disabled="!formState.jsonValue.mqtts.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
        <div v-show="type == 'COAP(s)'" class="space-y-6">
          <div class="border border-solid border-neutral-300 rounded-md px-4 py-3">
            <Form.Item :name="['jsonValue', 'coap', 'enabled']">
              <Switch size="small" v-model:checked="formState.jsonValue.coap.enabled" />
              <span class="ml-2 text-base font-bold"> {{ t('tb.setting.connectivity.coap') }} </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.hostAddress')" :name="['jsonValue', 'coap', 'host']">
                  <Input
                    v-model:value="formState.jsonValue.coap.host"
                    :placeholder="t('tb.setting.connectivity.host')"
                    :disabled="!formState.jsonValue.coap.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.portNumber')" :name="['jsonValue', 'coap', 'port']">
                  <Input
                    v-model:value="formState.jsonValue.coap.port"
                    :placeholder="t('tb.setting.connectivity.port')"
                    :disabled="!formState.jsonValue.coap.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <div class="border border-solid border-neutral-300 rounded-md px-4 py-3">
            <Form.Item :name="['jsonValue', 'coaps', 'enabled']">
              <Switch size="small" v-model:checked="formState.jsonValue.coaps.enabled" />
              <span class="ml-2 text-base font-bold"> {{ t('tb.setting.connectivity.coaps') }} </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.hostAddress')" :name="['jsonValue', 'coaps', 'host']">
                  <Input
                    v-model:value="formState.jsonValue.coaps.host"
                    :placeholder="t('tb.setting.connectivity.host')"
                    :disabled="!formState.jsonValue.coaps.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item :label="t('tb.setting.connectivity.portNumber')" :name="['jsonValue', 'coaps', 'port']">
                  <Input
                    v-model:value="formState.jsonValue.coaps.port"
                    :placeholder="t('tb.setting.connectivity.port')"
                    :disabled="!formState.jsonValue.coaps.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      </Form>

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
<script lang="ts" setup name="ViewsTbSettingConnectivitySetting">
  import { ref, onMounted, reactive, computed } from 'vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { getAdminSetting, saveAdminSetting, AdminSetting } from '/@/api/tb/adminSetting';
  import { Segmented, Switch, Space, Spin, Form, Input, Row, Col } from 'ant-design-vue';

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const formRef = ref<FormInstance>();
  const record = ref<AdminSetting>({} as AdminSetting);
  const dataLoading = ref(false);
  const type = ref('HTTP(s)');

  const segmentedOptions = computed(() => [
    { label: 'HTTP(s)', value: 'HTTP(s)' },
    { label: 'MQTT(s)', value: 'MQTT(s)' },
    { label: 'COAP(s)', value: 'COAP(s)' },
  ]);

  const formState = reactive<AdminSetting>({
    tenantId: { entityType: EntityType.TENANT, id: '' },
    key: 'connectivity',
    jsonValue: {
      http: { enabled: true, host: '', port: '8080' },
      https: { enabled: false, host: '', port: '443' },
      mqtt: { enabled: true, host: '', port: '1883' },
      mqtts: { enabled: false, host: '', port: '8883' },
      coap: { enabled: true, host: '', port: '5683' },
      coaps: { enabled: false, host: '', port: '5684' },
    },
  } as AdminSetting);

  onMounted(() => {
    fetchData();
  });

  async function fetchData() {
    try {
      dataLoading.value = true;
      clear();
      const result = await getAdminSetting('connectivity');
      record.value = result;
      Object.keys(record.value).forEach((key) => {
        formState[key] = record.value[key];
      });
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
    formState.key = 'general';
    formState.jsonValue = {
      http: { enabled: true, host: '', port: '8080' },
      https: { enabled: false, host: '', port: '443' },
      mqtt: { enabled: true, host: '', port: '1883' },
      mqtts: { enabled: false, host: '', port: '8883' },
      coap: { enabled: true, host: '', port: '5683' },
      coaps: { enabled: false, host: '', port: '5684' },
    };
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      dataLoading.value = true;
      // console.log('submit', params, data, record);
      const res = await saveAdminSetting({ ...record.value, ...data });
      fetchData();
      showMessage(t('tb.setting.connectivity.saveSuccess'));
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
  .connectivity-setting {
    padding: 6px 46px 24px 24px;

    .ant-segmented-item-selected {
      background-color: @primary-color !important;
      color: @white !important;
    }

    .ant-segmented-item-label {
      padding: 0 80px !important;
    }

    .footer {
      margin-top: 42px;
    }
  }
</style>
