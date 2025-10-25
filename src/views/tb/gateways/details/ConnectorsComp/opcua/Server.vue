<template>
  <div class="p-4">
    <Form ref="formRef" :model="formState" layout="vertical">
      <!-- 服务器端点配置 -->
      <FormItem
        :label="t('tb.gateway.details.opcua.server.url')"
        name="url"
        :rules="[{ required: true, message: t('tb.gateway.details.opcua.server.urlRequired') }]"
      >
        <Input
          v-model:value="formState.url"
          :placeholder="t('tb.gateway.details.opcua.server.urlPlaceholder')"
          allow-clear
        />
      </FormItem>

      <!-- 超时和安全策略 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem :label="t('tb.gateway.details.opcua.server.timeout')" name="timeoutInMillis">
          <InputNumber
            v-model:value="formState.timeoutInMillis"
            :min="0"
            :placeholder="t('tb.gateway.details.opcua.server.timeoutPlaceholder')"
            class="w-full"
            addon-after="ms"
          />
        </FormItem>

        <FormItem :label="t('tb.gateway.details.opcua.server.securityPolicy')" name="security">
          <Select
            v-model:value="formState.security"
            :placeholder="t('tb.gateway.details.opcua.server.securityPolicyPlaceholder')"
            :options="securityPolicyOptions"
            allow-clear
          />
        </FormItem>
      </div>

      <!-- 扫描周期和订阅检查周期 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem :label="t('tb.gateway.details.opcua.server.scanPeriod')" name="scanPeriodInMillis">
          <InputNumber
            v-model:value="formState.scanPeriodInMillis"
            :min="0"
            :placeholder="t('tb.gateway.details.opcua.server.scanPeriodPlaceholder')"
            class="w-full"
            addon-after="ms"
          />
        </FormItem>

        <FormItem :label="t('tb.gateway.details.opcua.server.subCheckPeriod')" name="subCheckPeriodInMillis">
          <InputNumber
            v-model:value="formState.subCheckPeriodInMillis"
            :min="0"
            :placeholder="t('tb.gateway.details.opcua.server.subCheckPeriodPlaceholder')"
            class="w-full"
            addon-after="ms"
          />
        </FormItem>
      </div>

      <!-- 启用订阅和显示映射 -->
      <div class="space-y-3">
        <FormItem name="disableSubscriptions" class="mb-0">
          <div class="flex items-center gap-3 p-3 border rounded hover:border-blue-400 transition-colors">
            <Switch v-model:checked="enableSubscription" />
            <span class="text-sm font-medium">{{ t('tb.gateway.details.opcua.server.enableSubscription') }}</span>
            <Tooltip :title="t('tb.gateway.details.opcua.server.enableSubscriptionTip')">
              <Icon icon="ant-design:info-circle-outlined" class="text-gray-400 cursor-help text-base" />
            </Tooltip>
          </div>
        </FormItem>

        <FormItem name="showMap" class="mb-0">
          <div class="flex items-center gap-3 p-3 border rounded hover:border-blue-400 transition-colors">
            <Switch v-model:checked="formState.showMap" />
            <span class="text-sm font-medium">{{ t('tb.gateway.details.opcua.server.showMap') }}</span>
            <Tooltip :title="t('tb.gateway.details.opcua.server.showMapTip')">
              <Icon icon="ant-design:info-circle-outlined" class="text-gray-400 cursor-help text-base" />
            </Tooltip>
          </div>
        </FormItem>
      </div>

      <!-- 安全认证配置 -->
      <div class="mt-6">
        <FormItem
          :label="t('tb.gateway.details.opcua.server.security')"
          :name="['identity', 'type']"
          :rules="[{ required: true, message: t('tb.gateway.details.opcua.server.securityRequired') }]"
        >
          <Segmented
            v-model:value="formState.identity!.type"
            :options="identityTypeOptions"
            block
            @change="handleIdentityTypeChange"
          />
        </FormItem>

        <!-- Anonymous 模式 - 不显示额外配置 -->

        <!-- Basic 模式 - 显示用户名密码 -->
        <div v-if="identityType === IDENTITY_TYPE.USERNAME" class="mt-4 space-y-4">
          <FormItem
            :label="t('tb.gateway.details.opcua.server.username')"
            :name="['identity', 'username']"
            :rules="[{ required: true, message: t('tb.gateway.details.opcua.server.usernameRequired') }]"
          >
            <Input
              v-model:value="formState.identity!.username"
              :placeholder="t('tb.gateway.details.opcua.server.usernamePlaceholder')"
              allow-clear
            />
          </FormItem>

          <FormItem :label="t('tb.gateway.details.opcua.server.password')" :name="['identity', 'password']">
            <InputPassword
              v-model:value="formState.identity!.password"
              :placeholder="t('tb.gateway.details.opcua.server.passwordPlaceholder')"
              allow-clear
            />
          </FormItem>
        </div>

        <!-- Certificates 模式 - 显示证书路径配置 -->
        <div v-if="identityType === IDENTITY_TYPE.CERTIFICATES" class="mt-4">
          <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div class="flex items-start gap-2">
              <Icon icon="ant-design:info-circle-outlined" class="text-blue-500 mt-0.5 flex-shrink-0" />
              <span class="text-sm text-blue-700">{{ t('tb.gateway.details.opcua.server.certPathTip') }}</span>
            </div>
          </div>

          <div class="space-y-4">
            <FormItem :label="t('tb.gateway.details.opcua.server.pathToCACert')" :name="['identity', 'pathToCACert']">
              <Input
                v-model:value="formState.identity!.pathToCACert"
                :placeholder="t('tb.gateway.details.opcua.server.pathToCACertPlaceholder')"
                allow-clear
              />
            </FormItem>

            <FormItem
              :label="t('tb.gateway.details.opcua.server.pathToPrivateKey')"
              :name="['identity', 'pathToPrivateKey']"
            >
              <Input
                v-model:value="formState.identity!.pathToPrivateKey"
                :placeholder="t('tb.gateway.details.opcua.server.pathToPrivateKeyPlaceholder')"
                allow-clear
              />
            </FormItem>

            <FormItem
              :label="t('tb.gateway.details.opcua.server.pathToClientCert')"
              :name="['identity', 'pathToClientCert']"
            >
              <Input
                v-model:value="formState.identity!.pathToClientCert"
                :placeholder="t('tb.gateway.details.opcua.server.pathToClientCertPlaceholder')"
                allow-clear
              />
            </FormItem>

            <FormItem :label="t('tb.gateway.details.opcua.server.mode')" :name="['identity', 'mode']">
              <Select
                v-model:value="formState.identity!.mode"
                :placeholder="t('tb.gateway.details.opcua.server.modePlaceholder')"
                :options="securityModeOptions"
                allow-clear
              />
            </FormItem>

            <FormItem :label="t('tb.gateway.details.opcua.server.username')" :name="['identity', 'username']">
              <Input
                v-model:value="formState.identity!.username"
                :placeholder="t('tb.gateway.details.opcua.server.usernamePlaceholder')"
                allow-clear
              />
            </FormItem>

            <FormItem :label="t('tb.gateway.details.opcua.server.password')" :name="['identity', 'password']">
              <InputPassword
                v-model:value="formState.identity!.password"
                :placeholder="t('tb.gateway.details.opcua.server.passwordPlaceholder')"
                allow-clear
              />
            </FormItem>
          </div>
        </div>
      </div>
    </Form>
  </div>
</template>

<script lang="ts" setup name="OpcuaServer">
  import { ref, watch, computed, PropType } from 'vue';
  import { Form, FormItem, Input, InputNumber, Select, Switch, Segmented, Tooltip } from 'ant-design-vue';
  import { InputPassword } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import {
    ServerConfig,
    getSecurityPolicyOptions,
    getSecurityModeOptions,
    getIdentityTypeOptions,
    IDENTITY_TYPE,
  } from './type';

  const props = defineProps({
    config: {
      type: Object as PropType<Partial<ServerConfig>>,
      default: () => ({}),
    },
  });

  const { t } = useI18n('');
  const { showMessage } = useMessage();
  const formRef = ref<FormInstance>();

  // 多语言选项
  const securityPolicyOptions = computed(() => getSecurityPolicyOptions(t));
  const securityModeOptions = computed(() => getSecurityModeOptions(t));
  const identityTypeOptions = computed(() => getIdentityTypeOptions(t));

  const formState = ref<ServerConfig>({
    url: '',
    timeoutInMillis: 5000,
    scanPeriodInMillis: 5000,
    disableSubscriptions: false,
    subCheckPeriodInMillis: 100,
    showMap: false,
    security: 'Basic128Rsa15',
    identity: {
      type: IDENTITY_TYPE.ANONYMOUS,
    },
  });

  // 订阅开关的计算属性（因为后端字段是 disableSubscriptions，需要反转）
  const enableSubscription = computed({
    get: () => !formState.value.disableSubscriptions,
    set: (val) => {
      formState.value.disableSubscriptions = !val;
    },
  });

  // 身份认证类型（只读计算属性）
  const identityType = computed(() => formState.value.identity?.type || IDENTITY_TYPE.ANONYMOUS);

  // 处理认证类型切换
  function handleIdentityTypeChange(val: string | number) {
    const newType = String(val);

    if (!formState.value.identity) {
      formState.value.identity = { type: newType as IDENTITY_TYPE };
      return;
    }

    // 切换认证类型时清空相关字段
    if (newType === IDENTITY_TYPE.ANONYMOUS) {
      delete formState.value.identity.username;
      delete formState.value.identity.password;
      delete formState.value.identity.pathToCACert;
      delete formState.value.identity.pathToPrivateKey;
      delete formState.value.identity.pathToClientCert;
      delete formState.value.identity.mode;
    } else if (newType === IDENTITY_TYPE.USERNAME) {
      delete formState.value.identity.pathToCACert;
      delete formState.value.identity.pathToPrivateKey;
      delete formState.value.identity.pathToClientCert;
      delete formState.value.identity.mode;
    } else if (newType === IDENTITY_TYPE.CERTIFICATES) {
      delete formState.value.identity.username;
      delete formState.value.identity.password;
    }
  }

  watch(
    () => props.config,
    (newConfig) => {
      if (newConfig && Object.keys(newConfig).length > 0) {
        formState.value = cloneDeep({
          url: '',
          timeoutInMillis: 5000,
          scanPeriodInMillis: 5000,
          disableSubscriptions: false,
          subCheckPeriodInMillis: 100,
          showMap: false,
          security: 'Basic128Rsa15',
          identity: {
            type: IDENTITY_TYPE.ANONYMOUS,
          },
          ...newConfig,
        });

        // 确保 identity 对象存在
        if (!formState.value.identity) {
          formState.value.identity = {
            type: IDENTITY_TYPE.ANONYMOUS,
          };
        }
      }
    },
    { immediate: true, deep: true },
  );

  async function getConfiguration() {
    try {
      await formRef.value?.validate();
      const config = cloneDeep(formState.value);

      // 清理空字段
      if (config.identity) {
        Object.keys(config.identity).forEach((key) => {
          if (config.identity![key] === undefined || config.identity![key] === '') {
            delete config.identity![key];
          }
        });
      }

      return {
        configurationJson: {
          server: config,
        },
      };
    } catch (error) {
      showMessage(t('tb.gateway.details.opcua.server.validationFailed'), 'error');
      throw error;
    }
  }

  defineExpose({ getConfiguration });
</script>

<style scoped>
  :deep(.ant-input-number) {
    width: 100%;
  }
</style>
