<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <!-- General & Custom statistics -->
    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4">
      <Row :gutter="16" align="middle">
        <Form.Item name="enable" style="margin-bottom: 0">
          <div class="flex items-center space-x-2">
            <Switch v-model:checked="formState.enable" />
            <span>{{ t('tb.gateway.statisticsConfig.general.enable') }}</span>

            <Tooltip :title="t('tb.gateway.statisticsConfig.general.tip')">
              <a>
                <Icon icon="ant-design:info-circle-outlined" />
              </a>
            </Tooltip>
          </div>
        </Form.Item>
      </Row>

      <Row :gutter="16" align="middle" v-if="'enableCustom' in formState">
        <Form.Item name="enableCustom" style="margin-bottom: 0">
          <div class="flex items-center space-x-2">
            <Switch v-model:checked="formState.enableCustom" :disabled="!formState.enable" />
            <span>{{ t('tb.gateway.statisticsConfig.general.enableCustom') }}</span>
            <Tooltip :title="t('tb.gateway.statisticsConfig.general.enableCustomTip')">
              <a>
                <Icon icon="ant-design:info-circle-outlined" />
              </a>
            </Tooltip>
          </div>
        </Form.Item>
      </Row>
      <Row :gutter="16" class="mt-2">
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.statisticsConfig.general.sendPeriod')"
            name="statsSendPeriodInSeconds"
            :rules="[{ required: true, message: t('tb.gateway.statisticsConfig.general.required') }]"
          >
            <InputNumber v-model:value="formState.statsSendPeriodInSeconds" :min="0" :style="{ width: '100%' }" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.gateway.statisticsConfig.general.customSendPeriod')"
            name="customStatsSendPeriodInSeconds"
            :rules="[{ required: true, message: t('tb.gateway.statisticsConfig.general.required') }]"
          >
            <InputNumber v-model:value="formState.customStatsSendPeriodInSeconds" :min="0" :style="{ width: '100%' }" />
          </Form.Item>
        </Col>
      </Row>
    </div>

    <!-- Commands -->
    <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
      <p class="text-base font-bold mb-1">{{ t('tb.gateway.statisticsConfig.commands.title') }}</p>
      <p class="text-sm text-neutral-500 mb-3">{{ t('tb.gateway.statisticsConfig.commands.subTitle') }}</p>
      <div
        v-for="(command, index) in formState.commands"
        :key="index"
        class="border border-solid border-neutral-300 rounded-md p-4 mb-3 relative"
      >
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.statisticsConfig.commands.timeSeriesName')"
              :name="['commands', index, 'attributeOnGateway']"
              :rules="{ required: true, message: t('tb.gateway.statisticsConfig.commands.timeSeriesNameRequired') }"
              :help="t('tb.gateway.statisticsConfig.commands.timeSeriesNameHelp')"
            >
              <Input v-model:value="command.attributeOnGateway" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.gateway.statisticsConfig.commands.timeout')"
              :name="['commands', index, 'timeout']"
              :rules="{ required: true, message: t('tb.gateway.statisticsConfig.general.required') }"
              :help="t('tb.gateway.statisticsConfig.commands.timeoutHelp')"
            >
              <InputNumber v-model:value="command.timeout" :min="0" :style="{ width: '100%' }" />
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="24">
            <Form.Item
              :label="t('tb.gateway.statisticsConfig.commands.command')"
              :name="['commands', index, 'command']"
              :rules="{ required: true, message: t('tb.gateway.statisticsConfig.general.required') }"
              :help="t('tb.gateway.statisticsConfig.commands.commandHelp')"
            >
              <Input v-model:value="command.command" />
            </Form.Item>
          </Col>
        </Row>
        <Collapse ghost>
          <CollapsePanel key="1" :header="t('tb.gateway.statisticsConfig.commands.advanced')">
            <Form.Item
              :label="t('tb.gateway.statisticsConfig.commands.installCmd')"
              :name="['commands', index, 'installCmd']"
              :help="t('tb.gateway.statisticsConfig.commands.installCmdHelp')"
            >
              <Input v-model:value="command.installCmd" />
            </Form.Item>
          </CollapsePanel>
        </Collapse>
        <div class="absolute top-2 right-2">
          <Button shape="circle" danger @click="removeCommand(index)">
            <template #icon><Icon icon="ant-design:delete-outlined" /></template>
          </Button>
        </div>
      </div>

      <Button type="dashed" block @click="addCommand">{{ t('tb.gateway.statisticsConfig.commands.add') }}</Button>
    </div>
  </Form>
</template>

<script lang="ts" setup name="Statistics">
  import { ref, reactive, watch, PropType } from 'vue';
  import { Form, Row, Col, Switch, InputNumber, Input, Button, Collapse, CollapsePanel, Tooltip } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';

  import { FormInstance } from 'ant-design-vue/lib/form';

  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  import { GeneralConfigurationValue } from '/@/api/tb/gateways/types/configuration';

  import { DEFAULT_STATISTICS_FORM } from './default';
  const { t } = useI18n('tb');

  type Configuration = GeneralConfigurationValue['statistics'];

  const props = defineProps({
    configuration: { type: Object as PropType<Partial<GeneralConfigurationValue>>, default: () => ({}) },
    ruleChainId: { type: String, default: '' },
  });

  const formRef = ref<FormInstance>();
  const formState = reactive<Partial<Configuration>>({});

  watch(
    () => props.configuration,
    (newValue) => {
      if (newValue && Object.keys(newValue).length > 0) {
        const config = newValue.statistics;
        Object.assign(formState, config);
      } else {
        Object.assign(formState, DEFAULT_STATISTICS_FORM);
      }
    },
    { immediate: true, deep: true },
  );

  function addCommand() {
    if (!formState.commands) {
      formState.commands = [];
    }
    formState.commands.push({ attributeOnGateway: '', timeout: 10, command: '', installCmd: '' });
  }

  function removeCommand(index: number) {
    formState.commands?.splice(index, 1);
  }

  async function getConfiguration() {
    await formRef.value?.validate();

    return { statistics: cloneDeep(formState) };
  }

  defineExpose({ getConfiguration });
</script>
