<script lang="ts" setup>
import type {
  AdminSettings,
  SmsProviderConfiguration,
  SmsProviderType,
} from '#/api/tb/admin';

import { onMounted, reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  InputPassword,
  message,
  Modal,
  Select,
  TextArea,
} from 'antdv-next';

import {
  getAdminSettings,
  saveAdminSettings,
  sendTestSms,
} from '#/api/tb/admin';

const formRef = ref();
const testFormRef = ref();
const showTestModal = ref(false);
const testSms = reactive({ message: '', numberTo: '' });

const PROVIDER_OPTIONS = [
  { label: $t('tb.settings.sms.providerAwsSns'), value: 'AWS_SNS' },
  { label: $t('tb.settings.sms.providerTwilio'), value: 'TWILIO' },
  { label: $t('tb.settings.sms.providerSmpp'), value: 'SMPP' },
];

const BIND_TYPE_OPTIONS = ['TX', 'RX', 'TRX'].map((v) => ({
  label: v,
  value: v,
}));

const SMPP_VERSION_OPTIONS = [3.3, 3.4].map((v) => ({
  label: String(v),
  value: v,
}));

/** 各类型的默认配置 */
function createConfig(type: SmsProviderType): SmsProviderConfiguration {
  switch (type) {
    case 'AWS_SNS': {
      return {
        accessKeyId: '',
        region: 'us-east-1',
        secretAccessKey: '',
        type,
      };
    }
    case 'SMPP': {
      return {
        addressRange: '',
        bindType: 'TX',
        codingScheme: 0,
        destinationNpi: 0,
        destinationTon: 5,
        host: '',
        password: '',
        port: null,
        protocolVersion: 3.3,
        serviceType: '',
        sourceAddress: '',
        sourceNpi: 0,
        sourceTon: 5,
        systemId: '',
        systemType: '',
        type,
      };
    }
    case 'TWILIO': {
      return { accountSid: '', accountToken: '', numberFrom: '', type };
    }
  }
}

const smsForm = reactive<AdminSettings<SmsProviderConfiguration>>({
  jsonValue: createConfig('AWS_SNS'),
  key: 'sms',
});

const requiredRule = [
  { message: $t('tb.settings.sms.requiredField'), required: true },
];

function onTypeChange(type: SmsProviderType) {
  smsForm.jsonValue = createConfig(type);
}

async function loadSms() {
  try {
    const data = await getAdminSettings<SmsProviderConfiguration>('sms');
    // 仅当后端已配置(jsonValue.type 存在)时覆盖默认
    if (data?.jsonValue?.type) {
      Object.assign(smsForm, data);
    }
  } catch {
    // 未配置(404)时保留默认
  }
}

async function saveSms() {
  await formRef.value?.validate();
  Object.assign(smsForm, await saveAdminSettings(smsForm));
  message.success($t('tb.common.saveSuccess'));
}

async function openTest() {
  await formRef.value?.validate();
  showTestModal.value = true;
}

async function handleSendTest() {
  await testFormRef.value?.validate();
  await sendTestSms({
    message: testSms.message,
    numberTo: testSms.numberTo,
    providerConfiguration: smsForm.jsonValue,
  });
  message.success($t('tb.settings.sms.testSmsSuccess'));
  showTestModal.value = false;
}

onMounted(loadSms);
</script>

<template>
  <div class="border-border bg-card rounded-lg border px-5 py-4">
    <div class="text-lg font-semibold">
      {{ $t('tb.settings.sms.title') }}
    </div>

    <Form ref="formRef" class="!mt-4" layout="vertical" :model="smsForm">
      <FormItem
        :label="$t('tb.settings.sms.provider')"
        :name="['jsonValue', 'type']"
        :rules="requiredRule"
      >
        <Select
          v-model:value="smsForm.jsonValue.type"
          class="sm:!w-1/2"
          :options="PROVIDER_OPTIONS"
          @change="(value: any) => onTypeChange(value as SmsProviderType)"
        />
      </FormItem>

      <!-- AWS SNS -->
      <template v-if="smsForm.jsonValue.type === 'AWS_SNS'">
        <div class="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <FormItem
            :label="$t('tb.settings.sms.accessKeyId')"
            :name="['jsonValue', 'accessKeyId']"
            :rules="requiredRule"
          >
            <Input v-model:value="smsForm.jsonValue.accessKeyId" allow-clear />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.region')"
            :name="['jsonValue', 'region']"
            :rules="requiredRule"
          >
            <Input v-model:value="smsForm.jsonValue.region" allow-clear />
          </FormItem>
          <FormItem
            class="sm:col-span-2"
            :label="$t('tb.settings.sms.secretAccessKey')"
            :name="['jsonValue', 'secretAccessKey']"
            :rules="requiredRule"
          >
            <InputPassword v-model:value="smsForm.jsonValue.secretAccessKey" />
          </FormItem>
        </div>
      </template>

      <!-- Twilio -->
      <template v-else-if="smsForm.jsonValue.type === 'TWILIO'">
        <FormItem
          :label="$t('tb.settings.sms.accountSid')"
          :name="['jsonValue', 'accountSid']"
          :rules="requiredRule"
        >
          <Input v-model:value="smsForm.jsonValue.accountSid" allow-clear />
        </FormItem>
        <FormItem
          :label="$t('tb.settings.sms.accountToken')"
          :name="['jsonValue', 'accountToken']"
          :rules="requiredRule"
        >
          <InputPassword v-model:value="smsForm.jsonValue.accountToken" />
        </FormItem>
        <FormItem
          :label="$t('tb.settings.sms.numberFrom')"
          :name="['jsonValue', 'numberFrom']"
          :rules="requiredRule"
        >
          <Input
            v-model:value="smsForm.jsonValue.numberFrom"
            allow-clear
            placeholder="+15551234567"
          />
        </FormItem>
      </template>

      <!-- SMPP -->
      <template v-else-if="smsForm.jsonValue.type === 'SMPP'">
        <div class="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <FormItem
            :label="$t('tb.settings.sms.protocolVersion')"
            :name="['jsonValue', 'protocolVersion']"
          >
            <Select
              v-model:value="smsForm.jsonValue.protocolVersion"
              :options="SMPP_VERSION_OPTIONS"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.bindType')"
            :name="['jsonValue', 'bindType']"
          >
            <Select
              v-model:value="smsForm.jsonValue.bindType"
              :options="BIND_TYPE_OPTIONS"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.host')"
            :name="['jsonValue', 'host']"
            :rules="requiredRule"
          >
            <Input v-model:value="smsForm.jsonValue.host" allow-clear />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.port')"
            :name="['jsonValue', 'port']"
            :rules="requiredRule"
          >
            <InputNumber
              v-model:value="smsForm.jsonValue.port"
              class="w-full"
              :max="65_535"
              :min="1"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.systemId')"
            :name="['jsonValue', 'systemId']"
            :rules="requiredRule"
          >
            <Input v-model:value="smsForm.jsonValue.systemId" allow-clear />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.password')"
            :name="['jsonValue', 'password']"
            :rules="requiredRule"
          >
            <InputPassword v-model:value="smsForm.jsonValue.password" />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.systemType')"
            :name="['jsonValue', 'systemType']"
          >
            <Input v-model:value="smsForm.jsonValue.systemType" allow-clear />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.serviceType')"
            :name="['jsonValue', 'serviceType']"
          >
            <Input v-model:value="smsForm.jsonValue.serviceType" allow-clear />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.sourceAddress')"
            :name="['jsonValue', 'sourceAddress']"
          >
            <Input
              v-model:value="smsForm.jsonValue.sourceAddress"
              allow-clear
            />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.addressRange')"
            :name="['jsonValue', 'addressRange']"
          >
            <Input v-model:value="smsForm.jsonValue.addressRange" allow-clear />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.sourceTon')"
            :name="['jsonValue', 'sourceTon']"
          >
            <InputNumber
              v-model:value="smsForm.jsonValue.sourceTon"
              class="w-full"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.sourceNpi')"
            :name="['jsonValue', 'sourceNpi']"
          >
            <InputNumber
              v-model:value="smsForm.jsonValue.sourceNpi"
              class="w-full"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.destinationTon')"
            :name="['jsonValue', 'destinationTon']"
          >
            <InputNumber
              v-model:value="smsForm.jsonValue.destinationTon"
              class="w-full"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.destinationNpi')"
            :name="['jsonValue', 'destinationNpi']"
          >
            <InputNumber
              v-model:value="smsForm.jsonValue.destinationNpi"
              class="w-full"
            />
          </FormItem>
          <FormItem
            :label="$t('tb.settings.sms.codingScheme')"
            :name="['jsonValue', 'codingScheme']"
          >
            <InputNumber
              v-model:value="smsForm.jsonValue.codingScheme"
              class="w-full"
            />
          </FormItem>
        </div>
      </template>
    </Form>

    <div class="mt-4 flex flex-wrap items-center justify-start gap-2">
      <VbenButton variant="outline" @click="loadSms">
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton variant="outline" @click="openTest">
        {{ $t('tb.settings.sms.sendTestSms') }}
      </VbenButton>
      <VbenButton @click="saveSms">
        {{ $t('tb.common.save') }}
      </VbenButton>
    </div>

    <!-- 发送测试短信 -->
    <Modal
      v-model:open="showTestModal"
      :destroy-on-close="true"
      centered
      :ok-text="$t('tb.settings.sms.sendTestSms')"
      :title="$t('tb.settings.sms.sendTestSms')"
      @ok="handleSendTest"
    >
      <Form ref="testFormRef" class="mt-2" layout="vertical" :model="testSms">
        <FormItem
          :label="$t('tb.settings.sms.phoneNumber')"
          name="numberTo"
          :rules="requiredRule"
        >
          <Input
            v-model:value="testSms.numberTo"
            allow-clear
            placeholder="+8613012345678"
          />
        </FormItem>
        <FormItem
          :label="$t('tb.settings.sms.message')"
          name="message"
          :rules="requiredRule"
        >
          <TextArea v-model:value="testSms.message" :rows="4" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
