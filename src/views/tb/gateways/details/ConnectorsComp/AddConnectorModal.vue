<template>
  <BasicModal
    :title="t('tb.gateway.details.addConnector.title')"
    v-bind="$attrs"
    :showFooter="true"
    @register="registerModal"
    @ok="handleSubmit"
    width="600px"
  >
    <Form ref="formRef" :model="form" :labelCol="{ span: 7 }" :wrapperCol="{ span: 16 }">
      <FormItem :label="t('tb.gateway.details.addConnector.type')">
        <Select v-model:value="form.type" :options="CONNECTORS_TYPE_OPTIONS" />
      </FormItem>
      <FormItem :label="t('tb.gateway.details.addConnector.name')" name="name" :rules="nameRules" required>
        <Input v-model:value="form.name" />
      </FormItem>
      <FormItem :label="t('tb.gateway.details.addConnector.loggingLevel')">
        <Select v-model:value="form.logLevel" :options="LOGGING_LEVEL_OPTIONS" />
      </FormItem>
      <!-- Remote logging -->
      <div class="border border-solid border-neutral-300 rounded-md py-1 px-4 mb-4">
        <div class="flex items-center space-x-2 py-2">
          <Switch v-model:checked="form.useDefaults" />
          <span>{{ t('tb.gateway.details.addConnector.fillDefaults') }}</span>
          <Tooltip :title="t('tb.gateway.details.addConnector.fillDefaultsTooltip')">
            <a>
              <Icon :icon="'ant-design:info-circle-outlined'" />
            </a>
          </Tooltip>
        </div>
      </div>
    </Form>
  </BasicModal>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import dayjs from 'dayjs';
  import { useRoute } from 'vue-router';
  import { Form, FormItem, Input, Select, Switch, Tooltip } from 'ant-design-vue';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Icon } from '/@/components/Icon';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { Scope } from '/@/enums/telemetryEnum';

  import { saveEntityAttributesV1 } from '/@/api/tb/telemetry';

  import {
    CONNECTOR_MODE,
    ConnectorBaseInfo,
    CONNECTORS_TYPE,
    CONNECTORS_TYPE_OPTIONS,
    LOGGING_LEVEL_ENUM,
    LOGGING_LEVEL_OPTIONS,
  } from './types';
  import { buildDefaultConfiguration } from './defaultConfig/defaults';
  import { cloneDeep } from 'lodash-es';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  const route = useRoute();
  const entityId = {
    id: route.params.gatewayId as string,
    entityType: EntityType.DEVICE,
  };

  const initialForm = {
    type: CONNECTORS_TYPE.MQTT,
    name: '',
    logLevel: LOGGING_LEVEL_ENUM.INFO,
    useDefaults: true,
    mode: CONNECTOR_MODE.BASIC,
    configVersion: '',
    configurationJson: {},
    configuration: '',
    ts: 0,
    sendDataOnlyOnChange: false,
  };

  const form = ref<ConnectorBaseInfo>(cloneDeep(initialForm));

  const formRef = ref();
  const activeConnectors = ref<string[]>([]);
  const inactiveConnectors = ref<string[]>([]);
  const version = ref('');

  const nameRules = [
    { required: true, message: t('tb.gateway.details.addConnector.nameRequired') },
    {
      validator: async (_rule, value: string) => {
        const exists = [...activeConnectors.value, ...inactiveConnectors.value]?.some(
          (c) => c === String(value || '').trim(),
        );
        if (exists) return Promise.reject(t('tb.gateway.details.addConnector.nameExists'));
        return Promise.resolve();
      },
      trigger: ['blur', 'change'],
    },
  ] as any;

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    // 充值表单
    form.value = cloneDeep(initialForm);

    activeConnectors.value = data.activeConnectors ?? [];
    inactiveConnectors.value = data.inactiveConnectors ?? [];
    version.value = data.version;

    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      setModalProps({ confirmLoading: true });

      await (formRef.value as any)?.validate?.();

      form.value.configVersion = version.value;
      form.value.ts = dayjs().valueOf();
      form.value.configuration = `${(form.value.name || '').trim()}.json`;

      if (form.value.useDefaults) {
        form.value.configurationJson = buildDefaultConfiguration(form.value.type);
      }

      // 从connectors当中获取对应状态的 inactive_connectors或者active_connectors
      const active = activeConnectors.value;

      active.push(form.value.name);

      await saveEntityAttributesV1(entityId, Scope.SHARED_SCOPE, {
        active_connectors: active,
      });

      await saveEntityAttributesV1(entityId, Scope.SHARED_SCOPE, {
        [form.value.name]: form.value,
      });

      setTimeout(closeModal);
      emit('success', active);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>

<style scoped></style>
