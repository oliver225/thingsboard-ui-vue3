<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import type {
  AdminSettings,
  SmsProviderConfiguration,
  SmsProviderType,
} from '#/api/tb/admin';

import { onMounted, reactive, ref } from 'vue';

import {
  useVbenModal,
  VbenButton,
  VbenInputPassword,
  VbenSelect,
} from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
  TextArea,
} from 'antdv-next';

import {
  getAdminSettings,
  saveAdminSettings,
  sendTestSms,
} from '#/api/tb/admin';
import { FormSection } from '#/components/form-section';
import { useFormRequest } from '#/hooks/use-form-request';

import SettingsPanel from '../components/settings-panel.vue';

const { isLoading, isSaving, isReady, read, write } = useFormRequest();

const formRef = ref<FormInstance>();
const testFormRef = ref<FormInstance>();
const testSms = reactive({ message: '', numberTo: '' });
const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onConfirm: handleSendTest,
});

const PROVIDER_OPTIONS = [
  {
    label: $t('settings.features.notifications.sms.providerAwsSns'),
    value: 'AWS_SNS',
  },
  {
    label: $t('settings.features.notifications.sms.providerTwilio'),
    value: 'TWILIO',
  },
  {
    label: $t('settings.features.notifications.sms.providerSmpp'),
    value: 'SMPP',
  },
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
function createDefaultSmsConfiguration(
  type: SmsProviderType,
): SmsProviderConfiguration {
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

const formValues = reactive<AdminSettings<SmsProviderConfiguration>>({
  jsonValue: createDefaultSmsConfiguration('AWS_SNS'),
  key: 'sms',
});

const requiredRule = [
  { message: $t('settings.validation.requiredField'), required: true },
];

function handleTypeChange(type: SmsProviderType) {
  formValues.jsonValue = createDefaultSmsConfiguration(type);
  void formRef.value?.validateFields([['jsonValue', 'type']]).catch(() => {});
}

async function performLoad() {
  try {
    const data = await getAdminSettings<SmsProviderConfiguration>('sms');
    // 仅当后端已配置(jsonValue.type 存在)时覆盖默认
    if (data?.jsonValue?.type) {
      Object.assign(formValues, data);
    }
  } catch (error: any) {
    if (error?.response?.status !== 404) throw error;
  }
}

async function performSave() {
  await formRef.value?.validate();
  Object.assign(formValues, await saveAdminSettings(formValues));
  message.success($t('tb.common.saveSuccess'));
}

async function handleTest() {
  if (!isReady.value || isLoading.value || isSaving.value) return;
  await formRef.value?.validate();
  modalApi.open();
}

async function handleSendTest() {
  const form = testFormRef.value;
  if (!isReady.value || isLoading.value || isSaving.value || !form) return;
  modalApi.lock();
  try {
    await write(async () => {
      await form.validate();
      await sendTestSms({
        message: testSms.message,
        numberTo: testSms.numberTo,
        providerConfiguration: formValues.jsonValue,
      });
      message.success($t('settings.features.notifications.sms.testSmsSuccess'));
      modalApi.close();
    });
  } finally {
    modalApi.unlock();
  }
}

const handleReload = () => read(performLoad);
const handleSave = () => write(performSave);
onMounted(handleReload);
</script>

<template>
  <SettingsPanel
    :show-header="false"
    :title="$t('settings.features.notifications.sms.title')"
  >
    <Form
      ref="formRef"
      class="flex flex-col gap-6 [&_.ant-form-item-label>label]:!text-sm [&_.ant-form-item-label>label]:!font-medium"
      layout="vertical"
      :model="formValues"
      :disabled="!isReady || isLoading || isSaving"
    >
      <FormSection>
        <FormItem
          class="!mb-0"
          :label="$t('settings.features.notifications.sms.provider')"
          :name="['jsonValue', 'type']"
          :rules="requiredRule"
        >
          <VbenSelect
            class="h-10"
            v-model="formValues.jsonValue.type"
            :disabled="!isReady || isLoading || isSaving"
            :options="PROVIDER_OPTIONS"
            @update:model-value="
              (value) => handleTypeChange(value as SmsProviderType)
            "
          />
        </FormItem>
      </FormSection>

      <FormSection v-if="formValues.jsonValue.type !== 'SMPP'">
        <!-- AWS SNS -->
        <template v-if="formValues.jsonValue.type === 'AWS_SNS'">
          <div
            class="grid grid-cols-1 gap-x-6 !gap-y-5 md:grid-cols-2 [&>.ant-form-item]:!mb-0"
          >
            <FormItem
              :label="$t('settings.features.notifications.sms.accessKeyId')"
              :name="['jsonValue', 'accessKeyId']"
              :rules="requiredRule"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.accessKeyId"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.region')"
              :name="['jsonValue', 'region']"
              :rules="requiredRule"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.region"
              />
            </FormItem>
            <FormItem
              class="md:col-span-2"
              :label="$t('settings.features.notifications.sms.secretAccessKey')"
              :name="['jsonValue', 'secretAccessKey']"
              :rules="requiredRule"
            >
              <VbenInputPassword
                :disabled="!isReady || isLoading || isSaving"
                class="h-10 text-sm shadow-xs aria-[invalid=true]:border-destructive"
                v-model="formValues.jsonValue.secretAccessKey"
              />
            </FormItem>
          </div>
        </template>

        <!-- Twilio -->
        <template v-else-if="formValues.jsonValue.type === 'TWILIO'">
          <div
            class="grid grid-cols-1 gap-x-6 !gap-y-5 md:grid-cols-2 [&>.ant-form-item]:!mb-0"
          >
            <FormItem
              :label="$t('settings.features.notifications.sms.accountSid')"
              :name="['jsonValue', 'accountSid']"
              :rules="requiredRule"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.accountSid"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.accountToken')"
              :name="['jsonValue', 'accountToken']"
              :rules="requiredRule"
            >
              <VbenInputPassword
                :disabled="!isReady || isLoading || isSaving"
                class="h-10 text-sm shadow-xs aria-[invalid=true]:border-destructive"
                v-model="formValues.jsonValue.accountToken"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.numberFrom')"
              :name="['jsonValue', 'numberFrom']"
              :rules="requiredRule"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.numberFrom"
                placeholder="+15551234567"
              />
            </FormItem>
          </div>
        </template>
      </FormSection>
      <template v-else>
        <FormSection
          :title="$t('settings.features.notifications.sms.connection')"
        >
          <div class="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <FormItem
              :label="$t('settings.features.notifications.sms.protocolVersion')"
              :name="['jsonValue', 'protocolVersion']"
            >
              <Select
                class="!min-h-10 w-full !rounded-md !border-input !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.protocolVersion"
                :options="SMPP_VERSION_OPTIONS"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.bindType')"
              :name="['jsonValue', 'bindType']"
            >
              <VbenSelect
                class="h-10"
                v-model="formValues.jsonValue.bindType"
                :disabled="!isReady || isLoading || isSaving"
                :options="BIND_TYPE_OPTIONS"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.host')"
              :name="['jsonValue', 'host']"
              :rules="requiredRule"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.host"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.port')"
              :name="['jsonValue', 'port']"
              :rules="requiredRule"
            >
              <InputNumber
                v-model:value="formValues.jsonValue.port"
                class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full [&_input]:!text-sm"
                :max="65_535"
                :min="1"
              />
            </FormItem>
          </div>
        </FormSection>
        <FormSection
          :title="$t('settings.features.notifications.sms.authentication')"
        >
          <div class="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <FormItem
              :label="$t('settings.features.notifications.sms.systemId')"
              :name="['jsonValue', 'systemId']"
              :rules="requiredRule"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.systemId"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.password')"
              :name="['jsonValue', 'password']"
              :rules="requiredRule"
            >
              <VbenInputPassword
                :disabled="!isReady || isLoading || isSaving"
                class="h-10 text-sm shadow-xs aria-[invalid=true]:border-destructive"
                v-model="formValues.jsonValue.password"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.systemType')"
              :name="['jsonValue', 'systemType']"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.systemType"
              />
            </FormItem>
          </div>
        </FormSection>
        <FormSection
          :title="$t('settings.features.notifications.sms.addressing')"
        >
          <div class="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <FormItem
              :label="$t('settings.features.notifications.sms.serviceType')"
              :name="['jsonValue', 'serviceType']"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.serviceType"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.sourceAddress')"
              :name="['jsonValue', 'sourceAddress']"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.sourceAddress"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.addressRange')"
              :name="['jsonValue', 'addressRange']"
            >
              <Input
                :disabled="!isReady || isLoading || isSaving"
                class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
                v-model:value="formValues.jsonValue.addressRange"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.sourceTon')"
              :name="['jsonValue', 'sourceTon']"
            >
              <InputNumber
                v-model:value="formValues.jsonValue.sourceTon"
                class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full [&_input]:!text-sm"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.sourceNpi')"
              :name="['jsonValue', 'sourceNpi']"
            >
              <InputNumber
                v-model:value="formValues.jsonValue.sourceNpi"
                class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full [&_input]:!text-sm"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.destinationTon')"
              :name="['jsonValue', 'destinationTon']"
            >
              <InputNumber
                v-model:value="formValues.jsonValue.destinationTon"
                class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full [&_input]:!text-sm"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.destinationNpi')"
              :name="['jsonValue', 'destinationNpi']"
            >
              <InputNumber
                v-model:value="formValues.jsonValue.destinationNpi"
                class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full [&_input]:!text-sm"
              />
            </FormItem>
            <FormItem
              :label="$t('settings.features.notifications.sms.codingScheme')"
              :name="['jsonValue', 'codingScheme']"
            >
              <InputNumber
                v-model:value="formValues.jsonValue.codingScheme"
                class="!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full [&_input]:!text-sm"
              />
            </FormItem>
          </div>
        </FormSection>
      </template>
    </Form>
    <!-- 发送测试短信 -->
    <Modal
      class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
      content-class="px-6 pt-5 pb-1"
      :confirm-disabled="!isReady || isLoading || isSaving"
      :confirm-text="$t('settings.features.notifications.sms.sendTestSms')"
      :title="$t('settings.features.notifications.sms.sendTestSms')"
    >
      <Form
        ref="testFormRef"
        class="mt-2 space-y-5"
        layout="vertical"
        :model="testSms"
        :disabled="!isReady || isLoading || isSaving"
      >
        <FormItem
          :label="$t('settings.features.notifications.sms.phoneNumber')"
          name="numberTo"
          :rules="requiredRule"
        >
          <Input
            :disabled="!isReady || isLoading || isSaving"
            class="!h-10 !rounded-md !border-input !bg-background !text-sm !shadow-xs"
            v-model:value="testSms.numberTo"
            placeholder="+8613012345678"
          />
        </FormItem>
        <FormItem
          :label="$t('settings.features.notifications.sms.message')"
          name="message"
          :rules="requiredRule"
        >
          <TextArea
            class="!rounded-md !border-input !bg-background !text-sm !shadow-xs"
            v-model:value="testSms.message"
            :rows="4"
          />
        </FormItem>
      </Form>
    </Modal>
    <template #footer>
      <VbenButton
        variant="outline"
        class="min-w-20"
        :loading="isLoading"
        :disabled="isSaving"
        @click="handleReload"
      >
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton
        variant="outline"
        class="min-w-20"
        :disabled="!isReady || isLoading || isSaving"
        @click="handleTest"
      >
        {{ $t('settings.features.notifications.sms.sendTestSms') }}
      </VbenButton>
      <VbenButton
        variant="default"
        class="min-w-20"
        :loading="isSaving"
        :disabled="!isReady || isLoading"
        @click="handleSave"
      >
        {{ $t('tb.common.save') }}
      </VbenButton>
    </template>
  </SettingsPanel>
</template>
