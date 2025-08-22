<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { AdminSetting } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Loading } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  message,
  Row,
  Segmented,
  Switch,
} from 'ant-design-vue';

import { getAdminSettingsApi, saveAdminSettingsApi } from '#/api';
import { EntityType } from '#/constants';
import { useAuthStore } from '#/store';

defineOptions({
  name: 'GeneralSettings',
});

const authStore = useAuthStore();

const formRef = ref<FormInstance>();

const record = ref<AdminSetting>({} as AdminSetting);

const loading = ref(false);

const type = ref('HTTP(s)');

const formState = reactive<AdminSetting>({
  tenantId: authStore.getUserInfo().tenantId,
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

async function fetchData() {
  try {
    loading.value = true;
    clear();
    record.value = await getAdminSettingsApi('connectivity');
    Object.keys(record.value).forEach((key) => {
      const k = key as keyof AdminSetting;
      formState[k] = record.value[k];
    });
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  message.loading({
    content: `${$t('page.submit.loading')}`,
    duration: 0,
    key: 'is-form-submitting',
  });
  try {
    const data = await formRef.value?.validate();
    loading.value = true;
    // console.log('submit', params, data, record);
    await saveAdminSettingsApi({ ...record.value, ...data });
    fetchData();
    message.success({
      content: `${$t('保存设备连接成功！')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } catch (error: any) {
    message.error({
      content: error.message || `${$t('page.submit.error')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <div>
    <Loading :spinning="loading">
      <template #icon>
        <IconifyIcon
          icon="svg-spinners:bars-scale"
          class="text-primary size-12"
        />
      </template>
      <div class="my-2 text-lg font-semibold">设备连接</div>
      <Form ref="formRef" :model="formState" layout="vertical">
        <div class="mb-2 flex flex-col items-center">
          <Segmented
            block
            v-model:value="type"
            :options="['HTTP(s)', 'MQTT(s)', 'COAP(s)']"
          />
          <Alert
            class="my-4 w-[640px]"
            message="如果主机或端口字段为空，将使用默认的协议值。"
            type="error"
          />
        </div>

        <div v-show="type === 'HTTP(s)'" class="space-y-6">
          <div
            class="rounded-[var(--radius)] border border-solid border-[hsl(var(--border))] px-4 py-3"
          >
            <Form.Item :name="['jsonValue', 'http', 'enabled']">
              <Switch
                size="small"
                v-model:checked="formState.jsonValue.http.enabled"
              />
              <span class="ml-2 text-base font-bold"> HTTP </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item
                  label="主机地址"
                  :name="['jsonValue', 'http', 'host']"
                >
                  <Input
                    v-model:value="formState.jsonValue.http.host"
                    placeholder="主机"
                    :disabled="!formState.jsonValue.http.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="端口号" :name="['jsonValue', 'http', 'port']">
                  <Input
                    v-model:value="formState.jsonValue.http.port"
                    placeholder="端口"
                    :disabled="!formState.jsonValue.http.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <div
            class="rounded-[var(--radius)] border border-solid border-[hsl(var(--border))] px-4 py-3"
          >
            <Form.Item :name="['jsonValue', 'https', 'enabled']">
              <Switch
                size="small"
                v-model:checked="formState.jsonValue.https.enabled"
              />
              <span class="ml-2 text-base font-bold"> HTTPs </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item
                  label="主机地址"
                  :name="['jsonValue', 'https', 'host']"
                >
                  <Input
                    v-model:value="formState.jsonValue.https.host"
                    placeholder="主机"
                    :disabled="!formState.jsonValue.https.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="端口号"
                  :name="['jsonValue', 'https', 'port']"
                >
                  <Input
                    v-model:value="formState.jsonValue.https.port"
                    placeholder="端口"
                    :disabled="!formState.jsonValue.https.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
        <div v-show="type === 'MQTT(s)'" class="space-y-6">
          <div
            class="rounded-[var(--radius)] border border-solid border-[hsl(var(--border))] px-4 py-3"
          >
            <Form.Item :name="['jsonValue', 'mqtt', 'enabled']">
              <Switch
                size="small"
                v-model:checked="formState.jsonValue.mqtt.enabled"
              />
              <span class="ml-2 text-base font-bold"> MQTT </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item
                  label="主机地址"
                  :name="['jsonValue', 'mqtt', 'host']"
                >
                  <Input
                    v-model:value="formState.jsonValue.mqtt.host"
                    placeholder="主机"
                    :disabled="!formState.jsonValue.mqtt.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="端口号" :name="['jsonValue', 'mqtt', 'port']">
                  <Input
                    v-model:value="formState.jsonValue.mqtt.port"
                    placeholder="端口"
                    :disabled="!formState.jsonValue.mqtt.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <div
            class="rounded-[var(--radius)] border border-solid border-[hsl(var(--border))] px-4 py-3"
          >
            <Form.Item :name="['jsonValue', 'mqtts', 'enabled']">
              <Switch
                size="small"
                v-model:checked="formState.jsonValue.mqtts.enabled"
              />
              <span class="ml-2 text-base font-bold"> MQTTs </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item
                  label="主机地址"
                  :name="['jsonValue', 'mqtts', 'host']"
                >
                  <Input
                    v-model:value="formState.jsonValue.mqtts.host"
                    placeholder="主机"
                    :disabled="!formState.jsonValue.mqtts.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="端口号"
                  :name="['jsonValue', 'mqtts', 'port']"
                >
                  <Input
                    v-model:value="formState.jsonValue.mqtts.port"
                    placeholder="端口"
                    :disabled="!formState.jsonValue.mqtts.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
        <div v-show="type === 'COAP(s)'" class="space-y-6">
          <div
            class="rounded-[var(--radius)] border border-solid border-[hsl(var(--border))] px-4 py-3"
          >
            <Form.Item :name="['jsonValue', 'coap', 'enabled']">
              <Switch
                size="small"
                v-model:checked="formState.jsonValue.coap.enabled"
              />
              <span class="ml-2 text-base font-bold"> COAP </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item
                  label="主机地址"
                  :name="['jsonValue', 'coap', 'host']"
                >
                  <Input
                    v-model:value="formState.jsonValue.coap.host"
                    placeholder="主机"
                    :disabled="!formState.jsonValue.coap.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item label="端口号" :name="['jsonValue', 'coap', 'port']">
                  <Input
                    v-model:value="formState.jsonValue.coap.port"
                    placeholder="端口"
                    :disabled="!formState.jsonValue.coap.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <div
            class="rounded-[var(--radius)] border border-solid border-[hsl(var(--border))] px-4 py-3"
          >
            <Form.Item :name="['jsonValue', 'coaps', 'enabled']">
              <Switch
                size="small"
                v-model:checked="formState.jsonValue.coaps.enabled"
              />
              <span class="ml-2 text-base font-bold"> COAPs </span>
            </Form.Item>
            <Row :gutter="24">
              <Col :span="12">
                <Form.Item
                  label="主机地址"
                  :name="['jsonValue', 'coaps', 'host']"
                >
                  <Input
                    v-model:value="formState.jsonValue.coaps.host"
                    placeholder="主机"
                    :disabled="!formState.jsonValue.coaps.enabled"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="端口号"
                  :name="['jsonValue', 'coaps', 'port']"
                >
                  <Input
                    v-model:value="formState.jsonValue.coaps.port"
                    placeholder="端口"
                    :disabled="!formState.jsonValue.coaps.enabled"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      </Form>
      <div class="mt-4 flex content-center gap-4">
        <Button @click="fetchData" class="w-24">
          <IconifyIcon icon="ant-design:reload-outlined" />
          重置
        </Button>
        <Button
          :loading="loading"
          class="w-24"
          type="primary"
          @click="handleSubmit"
        >
          <IconifyIcon icon="ant-design:check-outlined" />
          保存
        </Button>
      </div>
    </Loading>
  </div>
</template>
