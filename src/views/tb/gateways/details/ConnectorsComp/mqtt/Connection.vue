<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <!-- 连接配置 -->
    <div>
      <div class="flex items-center mb-4">
        <div class="w-1 h-4 bg-blue-500 mr-2"></div>
        <span class="text-sm font-medium">{{ t('tb.gateway.details.mqtt.connection.title') }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FormItem
          :label="t('tb.gateway.details.mqtt.connection.hostAddress')"
          name="host"
          :rules="[{ required: true, message: t('tb.gateway.details.mqtt.connection.hostRequired') }]"
        >
          <Input v-model:value="formState.host" placeholder="127.0.0.1" />
        </FormItem>
        <FormItem
          :label="t('tb.gateway.details.mqtt.connection.port')"
          name="port"
          :rules="[{ required: true, message: t('tb.gateway.details.mqtt.connection.portRequired') }]"
        >
          <InputNumber v-model:value="formState.port" :min="1" :max="65535" placeholder="1883" class="!w-full" />
        </FormItem>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem :label="t('tb.gateway.details.mqtt.connection.mqttVersion')" name="version">
          <Select
            v-model:value="formState.version"
            :options="MQTT_VERSION_OPTIONS"
            :placeholder="t('tb.gateway.details.mqtt.connection.selectVersion')"
          />
        </FormItem>
        <FormItem :label="t('tb.gateway.details.mqtt.connection.clientId')" name="clientId">
          <Input v-model:value="formState.clientId" />
        </FormItem>
      </div>
    </div>

    <!-- 安全配置 -->
    <div>
      <div class="flex items-center mb-4">
        <div class="w-1 h-4 bg-orange-500 mr-2"></div>
        <span class="text-sm font-medium">{{ t('tb.gateway.details.mqtt.connection.securityConfig') }}</span>
      </div>

      <FormItem name="security">
        <Segmented
          v-model:value="formState.security.type"
          :options="SECURITY_TYPE_OPTIONS"
          @change="onSecurityTypeChange"
          class="w-full"
        />
      </FormItem>

      <!-- 基本认证 -->
      <div v-if="formState.security.type === SECURITY_TYPE.BASIC">
        <div class="bg-orange-50 border-l-4 border-orange-400 p-3 mb-4">
          <div class="flex items-start">
            <Icon icon="ant-design:user-outlined" class="text-orange-400 mr-2 mt-0.5 flex-shrink-0" />
            <div class="text-sm text-orange-700">{{ t('tb.gateway.details.mqtt.connection.basicAuth') }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormItem
            :label="t('tb.gateway.details.mqtt.connection.username')"
            :name="['security', 'username']"
            :rules="[{ required: true, message: t('tb.gateway.details.mqtt.connection.usernameRequired') }]"
          >
            <Input
              v-model:value="formState.security.username"
              :placeholder="t('tb.gateway.details.mqtt.connection.usernamePlace')"
            />
          </FormItem>
          <FormItem
            :label="t('tb.gateway.details.mqtt.connection.password')"
            :name="['security', 'password']"
            :rules="[{ required: true, message: t('tb.gateway.details.mqtt.connection.passwordRequired') }]"
          >
            <InputPassword
              v-model:value="formState.security.password"
              :placeholder="t('tb.gateway.details.mqtt.connection.passwordPlace')"
            />
          </FormItem>
        </div>
      </div>

      <!-- 证书认证 -->
      <div v-if="formState.security.type === SECURITY_TYPE.CERTIFICATES" class="mt-4">
        <div class="bg-orange-50 border-l-4 border-orange-400 p-3 mb-4">
          <div class="flex items-start">
            <Icon icon="ant-design:safety-certificate-outlined" class="text-orange-400 mr-2 mt-0.5 flex-shrink-0" />
            <div class="text-sm text-orange-700">{{ t('tb.gateway.details.mqtt.connection.certificateAuth') }}</div>
          </div>
        </div>

        <FormItem
          :label="t('tb.gateway.details.mqtt.connection.caCertPath')"
          :name="['security', 'pathToCACert']"
          :rules="[{ required: true, message: t('tb.gateway.details.mqtt.connection.caCertRequired') }]"
        >
          <Input v-model:value="formState.security.pathToCACert" placeholder="/etc/ssl/certs/ca.crt" />
        </FormItem>

        <FormItem
          :label="t('tb.gateway.details.mqtt.connection.privateKeyPath')"
          :name="['security', 'pathToPrivateKey']"
          :rules="[{ required: true, message: t('tb.gateway.details.mqtt.connection.privateKeyRequired') }]"
        >
          <Input v-model:value="formState.security.pathToPrivateKey" placeholder="/etc/ssl/private/client.key" />
        </FormItem>

        <FormItem
          :label="t('tb.gateway.details.mqtt.connection.clientCertPath')"
          :name="['security', 'pathToClientCert']"
          :rules="[{ required: true, message: t('tb.gateway.details.mqtt.connection.clientCertRequired') }]"
        >
          <Input v-model:value="formState.security.pathToClientCert" placeholder="/etc/ssl/certs/client.crt" />
        </FormItem>
      </div>

      <!-- 匿名连接 -->
      <div v-if="formState.security.type === SECURITY_TYPE.ANONYMOUS" class="mt-4">
        <div class="bg-gray-50 border-l-4 border-gray-400 p-3">
          <div class="flex items-start">
            <Icon icon="ant-design:unlock-outlined" class="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
            <div class="text-sm text-gray-600">{{ t('tb.gateway.details.mqtt.connection.anonymousAuth') }}</div>
          </div>
        </div>
      </div>
    </div>
  </Form>
</template>

<script lang="ts" setup name="Connection">
  import { ref, watch, PropType } from 'vue';
  import { Form, FormItem, Input, InputNumber, Select, Segmented, InputPassword } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { randomSecret } from '/@/utils';

  import { BrokerConfig, MQTT_VERSION_OPTIONS, SECURITY_TYPE, SECURITY_TYPE_OPTIONS } from './type';

  // 生成随机 clientId
  function generateClientId() {
    const randomStr = randomSecret(5); // 生成5位随机字符
    return `tb_gw_${randomStr}`;
  }

  const props = defineProps({
    config: {
      type: Object as PropType<Partial<BrokerConfig>>,
      default: () => ({}),
    },
  });

  const formRef = ref<FormInstance>();
  const { t } = useI18n();

  const initialState: BrokerConfig = {
    host: '127.0.0.1',
    port: 1883,
    clientId: generateClientId(),
    version: 5,
    maxMessageNumberPerWorker: 10,
    maxNumberOfWorkers: 100,
    sendDataOnlyOnChange: false,
    security: {
      type: SECURITY_TYPE.ANONYMOUS,
      username: '',
      password: '',
      pathToCACert: '',
      pathToPrivateKey: '',
      pathToClientCert: '',
    },
  };

  const formState = ref<BrokerConfig>(cloneDeep(initialState));

  watch(
    () => [props.config],
    () => {
      formState.value = cloneDeep(initialState);
      if (props.config) {
        formState.value = {
          ...formState.value,
          ...props.config,
          security: {
            ...formState.value.security,
            ...props.config.security,
          },
        };
      }
    },
    { immediate: true, deep: true },
  );

  function onSecurityTypeChange(type: any) {
    // 清空其他安全配置
    const security = { type } as any;

    if (type === SECURITY_TYPE.BASIC) {
      security.username = '';
      security.password = '';
    } else if (type === SECURITY_TYPE.CERTIFICATES) {
      security.pathToCACert = '';
      security.pathToPrivateKey = '';
      security.pathToClientCert = '';
    }

    formState.value.security = security;
  }

  async function getConfiguration() {
    const data = await formRef.value?.validate();
    if (!data) {
      throw new Error(t('tb.gateway.details.mqtt.connection.validationFailed'));
    }

    // 清理不需要的字段
    const result = cloneDeep(formState.value);

    if (result.security.type === SECURITY_TYPE.ANONYMOUS) {
      result.security = { type: SECURITY_TYPE.ANONYMOUS };
    } else if (result.security.type === SECURITY_TYPE.BASIC) {
      result.security = {
        type: SECURITY_TYPE.BASIC,
        username: result.security.username,
        password: result.security.password,
      };
    } else if (result.security.type === SECURITY_TYPE.CERTIFICATES) {
      result.security = {
        type: SECURITY_TYPE.CERTIFICATES,
        pathToCACert: result.security.pathToCACert,
        pathToPrivateKey: result.security.pathToPrivateKey,
        pathToClientCert: result.security.pathToClientCert,
      };
    }

    return { configurationJson: { broker: result } };
  }

  defineExpose({ getConfiguration });
</script>

<style scoped></style>
