<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4">
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.general.basic.remoteConfiguration')"
            name="remoteConfiguration"
            :help="t('tb.gateway.general.basic.remoteConfigurationHelp')"
          >
            <Switch :checked="formState.remoteConfiguration" @change="onRemoteConfigurationChange" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.general.basic.remoteShell')"
            name="remoteShell"
            :help="t('tb.gateway.general.basic.remoteShellHelp')"
          >
            <Switch v-model:checked="formState.remoteShell" />
          </Form.Item>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.general.basic.platformHost')"
            name="host"
            :rules="[{ required: true, message: t('tb.gateway.general.basic.platformHostRequired') }]"
            :help="t('tb.gateway.general.basic.platformHostHelp')"
          >
            <Input v-model:value="formState.host" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.general.basic.platformPort')"
            name="port"
            :rules="[{ required: true, message: t('tb.gateway.general.basic.platformPortRequired') }]"
            :help="t('tb.gateway.general.basic.platformPortHelp')"
          >
            <InputNumber v-model:value="formState.port" :min="0" :style="{ width: '100%' }" />
          </Form.Item>
        </Col>
      </Row>
    </div>

    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4">
      <p class="text-base font-bold mb-2">{{ t('tb.gateway.general.security.title') }}</p>

      <Segmented v-model:value="formState.security.type" block :options="SECURITY_TABS" />

      <!-- Access Token -->
      <div v-if="['accessToken', 'tlsAccessToken'].includes(activeSecurityKey)">
        <Form.Item
          :label="t('tb.gateway.general.security.accessToken')"
          :name="['security', 'accessToken']"
          :rules="{ required: true, message: t('tb.gateway.general.security.accessTokenRequired') }"
        >
          <Input v-model:value="formState.security.accessToken">
            <template #suffix>
              <Space>
                <Tooltip>
                  <template #title>{{ t('tb.gateway.general.security.copyTip') }}</template>
                  <a
                    :class="{ 'disabled-copy': !formState.security.accessToken }"
                    @click="handleCopyValue(formState.security.accessToken)"
                  >
                    <Icon icon="ant-design:copy-outlined" />
                  </a>
                </Tooltip>
                <Tooltip v-if="!formState.security.accessToken">
                  <template #title>{{ t('tb.gateway.general.security.generateAccessToken') }}</template>
                  <a @click="() => (formState.security.accessToken = randomSecret())">
                    <Icon icon="ant-design:reload-outlined" />
                  </a>
                </Tooltip>
              </Space>
            </template>
          </Input>
        </Form.Item>
      </div>

      <!-- TLS + Access Token -->
      <div v-if="activeSecurityKey === 'tlsAccessToken'">
        <Form.Item
          :label="t('tb.gateway.general.security.caCert')"
          :name="['security', 'caCert']"
          :rules="[{ required: true, message: t('tb.gateway.general.security.caCertRequired') }]"
          :help="t('tb.gateway.general.security.caCertHelp')"
        >
          <template v-if="formState.security.caCert">
            <Input.TextArea v-model:value="formState.security.caCert" :auto-size="{ minRows: 4, maxRows: 12 }" />
            <div class="mt-2">
              <a @click="removeCaCer" class="!color-red">
                <Icon icon="ant-design:delete-outlined" /> {{ t('tb.gateway.action.deleteText') }}
              </a>
            </div>
          </template>
          <template v-else>
            <Upload.Dragger
              v-model:fileList="formState.security.caCerFileList"
              :before-upload="() => false"
              :max-count="1"
              accept=".pem,.key"
              @change="handleCaCerChange"
            >
              <p class="ant-upload-drag-icon"><Icon icon="ant-design:cloud-upload-outlined" :size="48" /></p>
              <p class="ant-upload-text">{{ t('tb.gateway.general.security.draggerText') }}</p>
            </Upload.Dragger>
          </template>
        </Form.Item>
      </div>

      <!-- Username and Password -->
      <div v-if="activeSecurityKey === 'usernamePassword'">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.general.security.clientId')"
              :name="['security', 'clientId']"
              :help="t('tb.gateway.general.security.clientIdHelp')"
              :rules="{ required: true, message: t('tb.gateway.general.security.clientIdRequired') }"
            >
              <Input v-model:value="formState.security.clientId">
                <template #suffix>
                  <Tooltip :title="t('tb.gateway.general.security.copy')">
                    <a
                      :class="{ 'disabled-copy': !formState.security.clientId }"
                      @click="handleCopyValue(formState.security.clientId)"
                    >
                      <Icon icon="ant-design:copy-outlined" />
                    </a>
                  </Tooltip>
                  <Tooltip
                    :title="t('tb.gateway.general.security.generateUsername')"
                    v-if="!formState.security.clientId"
                  >
                    <a @click="() => (formState.security.clientId = randomSecret())">
                      <Icon icon="ant-design:reload-outlined" />
                    </a>
                  </Tooltip>
                </template>
              </Input>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.general.security.username')"
              :name="['security', 'username']"
              :help="t('tb.gateway.general.security.usernameHelp')"
            >
              <Input v-model:value="formState.security.username">
                <template #suffix>
                  <Space>
                    <Tooltip :title="t('tb.gateway.general.security.copy')">
                      <a
                        :class="{ 'disabled-copy': !formState.security.username }"
                        @click="handleCopyValue(formState.security.username)"
                      >
                        <Icon icon="ant-design:copy-outlined" />
                      </a>
                    </Tooltip>
                    <Tooltip
                      :title="t('tb.gateway.general.security.generateUsername')"
                      v-if="!formState.security.username"
                    >
                      <a @click="() => (formState.security.username = randomSecret())">
                        <Icon icon="ant-design:reload-outlined" />
                      </a>
                    </Tooltip>
                  </Space>
                </template>
              </Input>
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="24">
            <Form.Item
              :label="t('tb.gateway.general.security.password')"
              :name="['security', 'password']"
              :help="t('tb.gateway.general.security.passwordHelp')"
            >
              <Input v-model:value="formState.security.password">
                <template #suffix>
                  <Space>
                    <Tooltip :title="t('tb.gateway.general.security.copy')">
                      <a
                        :class="{ 'disabled-copy': !formState.security.password }"
                        @click="handleCopyValue(formState.security.password)"
                      >
                        <Icon icon="ant-design:copy-outlined" />
                      </a>
                    </Tooltip>
                    <Tooltip
                      :title="t('tb.gateway.general.security.generatePassword')"
                      v-if="!formState.security.password"
                    >
                      <a @click="() => (formState.security.password = randomSecret())">
                        <Icon icon="ant-design:reload-outlined" />
                      </a>
                    </Tooltip>
                  </Space>
                </template>
              </Input>
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>

    <div v-if="formState.reportStrategy" class="border border-solid border-neutral-300 rounded-md py-3 px-4">
      <p class="text-base font-bold mb-2">{{ t('tb.gateway.general.report.title') }}</p>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item :label="t('tb.gateway.general.report.type')" :name="['reportStrategy', 'type']">
            <Select v-model:value="formState.reportStrategy.type" :options="REPORT_TYPE_OPTIONS" />
          </Form.Item>
          <div v-if="SHOW_REPORT_PERIOD.includes(formState?.reportStrategy?.type ?? '')">
            <Form.Item
              :label="t('tb.gateway.general.report.type')"
              :name="['reportStrategy', 'reportPeriod']"
              :rules="[{ required: true, message: t('tb.gateway.general.report.reportPeriodRequired') }]"
            >
              <InputNumber
                v-model:value="formState.reportStrategy.reportPeriod"
                :addon-after="t('tb.gateway.general.report.ms')"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </div>
        </Col>
      </Row>
    </div>
  </Form>
</template>
<script lang="ts" setup name="General">
  import { ref, watch, reactive, PropType, computed, nextTick, h } from 'vue';
  import {
    Switch,
    Form,
    Input,
    InputNumber,
    Row,
    Col,
    Select,
    Upload,
    Tooltip,
    Space,
    Segmented,
    Modal,
    message,
  } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { Icon } from '/@/components/Icon';

  import { copyToClipboard, randomSecret } from '/@/utils';
  import { readFileAsText } from '/@/utils/file/download';
  import { useI18n } from '/@/hooks/web/useI18n';

  import { CredentialsType } from '/@/enums/deviceEnum';
  import { REPORT_TYPE_OPTIONS, SHOW_REPORT_PERIOD } from '/@/enums/gateway';

  import { GeneralConfigurationValue } from '/@/api/tb/gateways/types/configuration';
  import { DeviceCredentials } from '/@/api/tb/device';

  import { DEFAULT_GENERAL_FORM } from './default';
  import { SECURITY_TABS } from './enums';

  const props = defineProps({
    configuration: { type: Object as PropType<Partial<GeneralConfigurationValue>>, default: () => ({}) },
    device: { type: Object as PropType<Partial<DeviceCredentials>>, default: () => ({}) },
    gatewayName: { type: String, default: '' },
  });

  const formRef = ref<FormInstance>();
  const { t } = useI18n('');

  const formState = reactive<any>(cloneDeep(DEFAULT_GENERAL_FORM));
  // 原始配置的快照，用于提交时合并
  const originalConfiguration = ref<GeneralConfigurationValue>();

  const activeSecurityKey = computed(() => formState.security?.type);

  watch(
    () => [props.configuration, props.device],
    () => {
      const cfg = (props.configuration || {}) as Partial<GeneralConfigurationValue>;

      originalConfiguration.value = cloneDeep(props.configuration) as GeneralConfigurationValue;

      if (cfg && Object.keys(cfg).length) {
        formState.host = cfg.host ?? location.hostname;
        formState.port = cfg.port ?? 1883;
        formState.remoteShell = !!cfg.remoteShell;
        formState.remoteConfiguration = !!cfg.remoteConfiguration;
        formState.security = cfg.security;

        if (!cfg.security?.type) {
          formState.security.type = 'accessToken';
        }

        formState.reportStrategy = cfg.reportStrategy ? { ...cfg.reportStrategy } : undefined;
      } else {
        // 处理默认信息, 从device当中获取
        formState.security = renderSecurity();
      }
    },
    { immediate: true, deep: true },
  );

  /**
   * 转换 security 信息
   */
  function renderSecurity(): any {
    let security: any;
    const dc = props.device;
    switch (dc.credentialsType) {
      case CredentialsType.ACCESS_TOKEN:
        security = { type: 'accessToken', accessToken: dc.credentialsId || '' };
        break;
      case CredentialsType.MQTT_BASIC:
        const credentialsValue = JSON.parse(dc.credentialsValue ?? '{}');
        security = {
          type: 'usernamePassword',
          accessToken: null,
          ...credentialsValue,
          username: credentialsValue?.userName,
        };
        break;
      default:
        security = { type: 'accessToken', accessToken: '' };
    }
    return security;
  }

  function handleCopyValue(value?: string) {
    if (value) {
      copyToClipboard(value, t('common.copySuccess'));
    }
  }

  async function getConfiguration() {
    const data = await formRef.value?.validate();
    if (!data) {
      throw new Error('Form validation failed');
    }

    return cloneDeep(formState);
  }

  // 更新 ca 证书
  async function handleCaCerChange(info: any) {
    const file = info?.file?.originFileObj || info?.fileList?.[0]?.originFileObj;
    if (file) {
      formState.security.caCert = await readFileAsText(file);
    } else {
      formState.security.caCert = null;
    }
    await nextTick();
    formRef.value?.clearValidate?.(['security', 'caCert']);
    await formRef.value?.validateFields?.([['security', 'caCert']]);
  }

  function removeCaCer() {
    formState.security.caCert = null;
    formState.security.caCerFileList = [];
  }

  // 远程配置开关确认
  function onRemoteConfigurationChange(checked: any) {
    if (!!checked) {
      formState.remoteConfiguration = true;
      return;
    }

    const name = props.gatewayName || '';
    const state = reactive({ input: '' });

    const content = () =>
      h('div', { class: 'space-y-3' }, [
        h('div', { class: 'rc-danger-head' }, [
          h(Icon, { icon: 'ant-design:warning-filled', size: 18, style: { color: '#cf1322' } }),
          h(
            'span',
            { style: { color: '#cf1322', fontWeight: 'bold' } },
            t('tb.gateway.general.configurationsWillBeDeleted'),
          ),
        ]),
        h('p', { class: 'rc-danger-tip' }, t('tb.gateway.general.turningOffRemoteConfiguration')),
        h('div', { class: 'space-y-2' }, [
          h('div', [t('tb.gateway.general.enterGatewayNameBelow') + ' ', h('strong', name || '')]),
          h('div', [
            h(Input, {
              class: 'w-full',
              placeholder: t('tb.gateway.general.gatewayNamePlaceholder'),
              value: state.input,
              onInput: (e: any) => (state.input = e?.target?.value || ''),
            }),
          ]),
        ]),
      ]);

    const modal = Modal.confirm({
      width: 720,
      centered: true,
      wrapClassName: 'rc-danger-modal',
      icon: null,
      title: '',
      maskClosable: false,
      okText: t('tb.gateway.general.turnOff'),
      okType: 'danger',
      cancelText: t('tb.gateway.general.cancel'),
      content: content(),
      okButtonProps: { disabled: true },
      onOk: () => {
        if (state.input === name) {
          formState.remoteConfiguration = false;
          stop();
          return;
        }
        message.error(t('tb.gateway.general.gatewayNameMismatch'));
        return Promise.reject();
      },
      onCancel: () => {
        formState.remoteConfiguration = true;
        stop();
      },
    });

    const stop = watch(
      () => state.input,
      (val) => {
        modal.update?.({ okButtonProps: { disabled: val !== name } });
      },
      { immediate: true },
    );
  }

  defineExpose({ getConfiguration });
</script>
<style>
  .disabled-copy {
    color: rgba(0, 0, 0, 0.25);
    cursor: not-allowed;
  }

  /* Danger confirm modal styles */
  :global(.rc-danger-modal .ant-modal-body) {
    text-align: left;
    padding-top: 8px;
  }
  :global(.rc-danger-head) {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #cf1322;
    font-weight: 600;
    font-size: 16px;
  }

  :global(.rc-danger-modal .ant-input) {
    width: 100%;
    height: 36px;
  }
</style>
<style>
  .rc-danger-tip {
    color: #a8071a;
    background: #fff1f0;
    border: 1px solid #ffa39e;
    padding: 8px 12px;
    border-radius: 6px;
    text-align: left;
  }
</style>
