<template>
  <BasicModal v-bind="$attrs" @register="registerModal" @ok="handleSubmit" width="40%"
    :show-ok-btn="hasPermission(Authority.TENANT_ADMIN)">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm">
      <template #credentialsId="{ model, field }">
        <Input v-model:value="model[field]" :disabled="!hasPermission(Authority.TENANT_ADMIN)" placeholder="请输入访问令牌">
        <template #suffix>
          <Tooltip title="复制" v-if="!isEmpty(model[field])">
            <Icon :icon="'ant-design:copy-outlined'" :size="18" class="cursor-pointer"
              @click="copyToClipboard(model[field], '复制访问令牌成功！')" />
          </Tooltip>
          <Tooltip title="生成" v-if="hasPermission(Authority.TENANT_ADMIN)">
            <Icon :icon="'ant-design:reload-outlined'" :size="18" class="cursor-pointer"
              @click="model[field] = randomSecret(20)" />
          </Tooltip>
        </template>
        </Input>
      </template>
      <template #mqttClientId="{ model, field }">
        <Input v-model:value="model[field]" :disabled="!hasPermission(Authority.TENANT_ADMIN)" placeholder="请输入客户端ID">
        <template #suffix>
          <Tooltip title="复制" v-if="!isEmpty(model[field])">
            <Icon :icon="'ant-design:copy-outlined'" :size="18" class="cursor-pointer"
              @click="copyToClipboard(model[field], '复制ClientId成功！')" />
          </Tooltip>
          <Tooltip title="生成" v-if="hasPermission(Authority.TENANT_ADMIN)">
            <Icon :icon="'ant-design:reload-outlined'" :size="18" class="cursor-pointer"
              @click="model[field] = randomSecret(20)" />
          </Tooltip>
        </template>
        </Input>
      </template>
      <template #mqttUserName="{ model, field }">
        <Input v-model:value="model[field]" :disabled="!hasPermission(Authority.TENANT_ADMIN)" placeholder="请输入用户名">
        <template #suffix>
          <Tooltip title="复制" v-if="!isEmpty(model[field])">
            <Icon :icon="'ant-design:copy-outlined'" :size="18" class="cursor-pointer"
              @click="copyToClipboard(model[field], '复制用户名成功！')" />
          </Tooltip>
          <Tooltip title="生成" v-if="hasPermission(Authority.TENANT_ADMIN)">
            <Icon :icon="'ant-design:reload-outlined'" :size="18" class="cursor-pointer"
              @click="model[field] = randomSecret(20)" />
          </Tooltip>
        </template>
        </Input>
      </template>
      <template #mqttPassword="{ model, field }">
        <Input v-model:value="model[field]" :disabled="!hasPermission(Authority.TENANT_ADMIN)" placeholder="请输入密码">
        <template #suffix>
          <Tooltip title="复制" v-if="!isEmpty(model[field])">
            <Icon :icon="'ant-design:copy-outlined'" :size="18" class="cursor-pointer"
              @click="copyToClipboard(model[field], '复制密码成功！')" />
          </Tooltip>
          <Tooltip title="生成" v-if="hasPermission(Authority.TENANT_ADMIN)">
            <Icon :icon="'ant-design:reload-outlined'" :size="18" class="cursor-pointer"
              @click="model[field] = randomSecret(20)" />
          </Tooltip>
        </template>
        </Input>
      </template>

    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbDeviceCredentialsModal">
import { ref, computed } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { Icon } from '/@/components/Icon';
import { useUserStore } from '/@/store/modules/user';
import { useMessage } from '/@/hooks/web/useMessage';
import { Input, Tooltip } from 'ant-design-vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { DeviceInfo, DeviceCredentials, getDeviceCredentialsByDeviceId, updateDeviceCredentials } from '/@/api/tb/device';
import { Authority } from '/@/enums/authorityEnum';
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { CredentialsType } from '/@/enums/deviceEnum';
import { usePermission } from '/@/hooks/web/usePermission';
import { copyToClipboard } from '/@/utils';
import { isEmpty } from 'lodash-es';

const emit = defineEmits(['success', 'register']);
const { t } = useI18n('tb');
const { hasPermission } = usePermission();
const userStore = useUserStore();
const { showMessage } = useMessage();
const deviceInfo = ref<DeviceInfo>({} as DeviceInfo);
const record = ref<DeviceCredentials>({} as DeviceCredentials);
const getTitle = computed(() => ({
  icon: 'ant-design:safety-outlined',
  value: t('设备凭证'),
}));

const inputFormSchemas: FormSchema[] = [
  { field: 'deviceId', component: 'Input', defaultValue: deviceInfo.value?.id, show: false },
  {
    label: t('凭据类型'),
    field: 'credentialsType',
    component: 'Select',
    defaultValue: CredentialsType.ACCESS_TOKEN,
    componentProps: {
      disabled: !hasPermission(Authority.TENANT_ADMIN),
      options: [
        { label: 'Access Token', value: CredentialsType.ACCESS_TOKEN },
        { label: 'MQTT Basic', value: CredentialsType.MQTT_BASIC },
        { label: 'X.509', value: CredentialsType.X509_CERTIFICATE }
      ],
      onChange: handleCredentialsTypeChange,
    },
    required: true,
  },
  { // ACCESS_TOKEN
    label: t('访问令牌'),
    field: 'credentialsId',
    component: 'Input',
    slot: 'credentialsId',
    ifShow: false,
    required: true,
  },
  {  //MQTT_BASIC
    label: t('客户端ID'),
    field: 'mqtt.clientId',
    component: 'Input',
    slot: 'mqttClientId',
    ifShow: false,
    required: true,
  },
  {  //MQTT_BASIC
    label: t('用户名'),
    field: 'mqtt.userName',
    component: 'Input',
    slot: 'mqttUserName',
    ifShow: false,
    required: true,
  },
  {  //MQTT_BASIC
    label: t('密码'),
    field: 'mqtt.password',
    component: 'Input',
    slot: 'mqttPassword',
    ifShow: false,
    required: true,
  },
  {
    label: t('PEM证书格式'),
    field: 'credentialsValue',
    component: 'InputTextArea',
    componentProps: {
      disabled: !hasPermission(Authority.TENANT_ADMIN),
      autoSize: { minRows: 5 },
    },
    ifShow: false,
    required: true,
  },
];


const [registerForm, { resetFields, setFieldsValue, updateSchema, validate }] = useForm({
  labelWidth: 120,
  schemas: inputFormSchemas,
  baseColProps: { lg: 24, md: 24 },
});


const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  setModalProps({ loading: true });
  await resetFields();
  deviceInfo.value = data;
  record.value = await getDeviceCredentialsByDeviceId(data.id.id);
  if (record.value.credentialsType == CredentialsType.MQTT_BASIC) {
    record.value.mqtt = JSON.parse(record.value.credentialsValue);
  }
  await handleCredentialsTypeChange(record.value.credentialsType);
  setFieldsValue(record.value);
  setModalProps({ loading: false });
});


async function handleSubmit() {
  if (!hasPermission(Authority.TENANT_ADMIN)) {
    return showMessage('无权限！');
  }
  try {
    const data = await validate();
    setModalProps({ confirmLoading: true });
    if (CredentialsType.MQTT_BASIC == data.credentialsType) {
      data.credentialsValue = JSON.stringify({ ...data.mqtt });
    }
    if (CredentialsType.ACCESS_TOKEN == data.credentialsType) {
      data.credentialsValue = null;
    }
    if (CredentialsType.ACCESS_TOKEN != data.credentialsType) {
      data.credentialsId = randomSecret(40);
    }
    // console.log('submit', params, data, record);
    const res = await updateDeviceCredentials({ ...data, id: record.value.id });
    showMessage(`更新设备凭证成功！`);
    setTimeout(closeModal);
    emit('success', data);
  } catch (error: any) {
    if (error && error.errorFields) {
      showMessage(t('common.validateError'));
    }
    console.log('error', error);
  } finally {
    setModalProps({ confirmLoading: false });
  }
}

function randomSecret(length: number) {
  let str = '';
  let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

async function handleCredentialsTypeChange(credentialsType: string) {
  await updateSchema([{ // ACCESS_TOKEN
    label: t('访问令牌'),
    field: 'credentialsId',
    component: 'Input',
    slot: 'credentialsId',
    ifShow: CredentialsType.ACCESS_TOKEN == credentialsType,
    required: true,
  },
  {  //MQTT_BASIC
    label: t('客户端ID'),
    field: 'mqtt.clientId',
    component: 'Input',
    slot: 'mqttClientId',
    ifShow: CredentialsType.MQTT_BASIC == credentialsType,
    required: true,
  },
  {  //MQTT_BASIC
    label: t('用户名'),
    field: 'mqtt.userName',
    component: 'Input',
    slot: 'mqttUserName',
    ifShow: CredentialsType.MQTT_BASIC == credentialsType,
    required: true,
  },
  {  //MQTT_BASIC
    label: t('密码'),
    field: 'mqtt.password',
    component: 'Input',
    slot: 'mqttPassword',
    ifShow: CredentialsType.MQTT_BASIC == credentialsType,
    required: true,
  },
  {
    label: t('PEM证书格式'),
    field: 'credentialsValue',
    component: 'InputTextArea',
    componentProps: {
      disabled: !hasPermission(Authority.TENANT_ADMIN),
      autoSize: { minRows: 5 },
    },
    ifShow: CredentialsType.X509_CERTIFICATE == credentialsType,
    required: true,
  }])
}

</script>