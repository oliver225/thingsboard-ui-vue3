<template>
  <Card size="small" class="stretch-card" :bodyStyle="{ paddingTop: 0 }">
    <template #title>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <Icon icon="ant-design:api-outlined" class="text-blue-500 text-lg" />
          <span class="text-base font-medium">{{ connector?.value?.name || 'OPC UA Connector' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-4 w-px bg-gray-300"></div>
          <span class="text-sm text-gray-500">OPC UA Configuration</span>
          <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{{ `v${version}` }}</span>
        </div>
      </div>
    </template>
    <template #extra>
      <Segmented v-model:value="mode" :options="modeOptions" />
    </template>
    <div class="config">
      <Tabs v-model:activeKey="active" type="line">
        <!-- General 配置 - 所有模式共用 -->
        <TabPane key="general">
          <template #tab>
            <div class="flex items-center gap-2">
              <Icon icon="ant-design:setting-outlined" class="text-sm" />
              <span>{{ t('tb.gateway.details.connectorConfig.basicConfig') }}</span>
            </div>
          </template>
          <General v-bind="allProps.general" :ref="(el: any) => setComponentRef('general', el)" />
        </TabPane>

        <!-- 基础模式的 tabs -->
        <template v-if="mode === CONNECTOR_MODE.BASIC">
          <TabPane key="server">
            <template #tab>
              <div class="flex items-center gap-2">
                <Icon icon="ant-design:cluster-outlined" class="text-sm" />
                <span>{{ t('tb.gateway.details.connectorConfig.serverConfig') }}</span>
              </div>
            </template>
            <Server v-bind="allProps.server" :ref="(el: any) => setComponentRef('server', el)" />
          </TabPane>
          <TabPane key="mapping">
            <template #tab>
              <div class="flex items-center gap-2">
                <Icon icon="ant-design:swap-outlined" class="text-sm" />
                <span>{{ t('tb.gateway.details.connectorConfig.dataMapping') }}</span>
              </div>
            </template>
            <DataMapping v-bind="allProps.mapping" :ref="(el: any) => setComponentRef('mapping', el)" />
          </TabPane>
        </template>

        <!-- 高级模式的 Configuration tab -->
        <TabPane v-if="mode === CONNECTOR_MODE.ADVANCED" key="configuration">
          <template #tab>
            <div class="flex items-center gap-2">
              <Icon icon="ant-design:code-outlined" class="text-sm" />
              <span>{{ t('tb.gateway.details.connectorConfig.configuration') }}</span>
            </div>
          </template>
          <CodeEditor v-model:value="jsonConfiguration" :mode="MODE.JSON" style="height: 54vh" />
        </TabPane>
      </Tabs>

      <div class="footer">
        <Button @click="reset" class="mr-2" :disabled="saving">{{
          t('tb.gateway.details.connectorConfig.reset')
        }}</Button>
        <Button type="primary" @click="save" :loading="saving">{{
          t('tb.gateway.details.connectorConfig.save')
        }}</Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
  import { ref, shallowRef, watch, computed, nextTick, PropType } from 'vue';
  import { Tabs, TabPane, Button, Card, Segmented, Modal } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';

  import { Icon } from '/@/components/Icon';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { useMessage } from '/@/hooks/web/useMessage';

  import { General, Server, DataMapping } from './opcua';
  import { CONNECTOR_MODE, Connectors, CONNECTOR_MODE_OPTIONS } from './types';
  import { OpcuaGatewayConfig } from './opcua/type';
  import { useI18n } from '/@/hooks/web/useI18n';

  const props = defineProps({
    connector: {
      type: Object as PropType<Connectors>,
      default: () => null,
    },
    version: {
      type: String,
      default: '',
    },
    connectorNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  });

  const emit = defineEmits(['save', 'reset']);

  const { showMessage } = useMessage();
  const { t } = useI18n('');
  const mode = ref<CONNECTOR_MODE>(CONNECTOR_MODE.BASIC);
  const modeOptions = CONNECTOR_MODE_OPTIONS;

  const active = ref('general');
  const saving = ref(false);
  const jsonConfiguration = ref('');

  const configurationJson = ref<OpcuaGatewayConfig>();
  // 保存初始配置用于重置
  const initialConnector = ref<Connectors>();
  // 组件 ref 实例
  const componentRefs = shallowRef<Record<string, any>>({});

  watch(
    () => [props.connector],
    () => {
      configurationJson.value = props.connector.value.configurationJson;
      // 同步初始化 jsonConfiguration 用于高级模式显示
      if (props.connector.value.configurationJson) {
        jsonConfiguration.value = JSON.stringify(props.connector.value.configurationJson, null, 2);
      }
      // 保存初始配置的深拷贝用于重置
      if (props.connector) {
        initialConnector.value = cloneDeep(props.connector);
        mode.value = props.connector.value?.mode || CONNECTOR_MODE.BASIC;
      }
    },
    { immediate: true, deep: true },
  );

  // 监听模式切换
  watch(
    () => mode.value,
    async (newMode, oldMode) => {
      // 切换模式时，默认跳转到基本配置 tab
      active.value = 'general';

      // 切换到高级模式时
      if (newMode === CONNECTOR_MODE.ADVANCED && oldMode !== CONNECTOR_MODE.ADVANCED) {
        // 从基础模式切换到高级模式：收集基础配置转换为 JSON
        nextTick(async () => {
          await convertBasicToAdvanced();
        });
      } else if (oldMode === CONNECTOR_MODE.ADVANCED && newMode === CONNECTOR_MODE.BASIC) {
        // 从高级模式切换到基础模式：解析 JSON 更新基础配置
        convertAdvancedToBasic();
      }
    },
  );

  // 为每个 tab 组件准备 props
  const allProps = computed(() => ({
    general: {
      connector: props.connector.value,
      connectorNames: props.connectorNames,
      version: props.version,
    },
    server: {
      config: configurationJson.value?.server,
    },
    mapping: {
      config: configurationJson.value?.mapping,
    },
  }));

  function setComponentRef(key: string, el: any) {
    if (el) {
      componentRefs.value[key] = el;
    }
  }

  // 从基础模式转换到高级模式
  async function convertBasicToAdvanced() {
    try {
      // 以 props.connector.value.configurationJson 为基础
      let mergedConfigurationJson: Partial<OpcuaGatewayConfig> = cloneDeep(
        configurationJson.value || {
          mapping: [],
        },
      );

      // 只更新已经创建的组件的配置
      for (const [key, comp] of Object.entries(componentRefs.value || {})) {
        if (!comp || typeof (comp as any).getConfiguration !== 'function') continue;

        try {
          const result = await (comp as any).getConfiguration();

          if (key === 'general') {
            // General 组件不包含 configurationJson，跳过
            continue;
          } else if (result.configurationJson) {
            // 只更新该组件负责的部分
            if (key === 'server' && result.configurationJson.server) {
              mergedConfigurationJson.server = cloneDeep(result.configurationJson.server);
            } else if (key === 'mapping' && result.configurationJson.mapping) {
              mergedConfigurationJson.mapping = cloneDeep(result.configurationJson.mapping);
            }
          }
        } catch (error) {
          console.error(`Error getting configuration from ${key}:`, error);
        }
      }

      console.log('mergedConfigurationJson :>> ', mergedConfigurationJson);
      jsonConfiguration.value = JSON.stringify(mergedConfigurationJson, null, 2);
    } catch (error) {
      console.error('转换到高级模式失败:', error);
      showMessage(t('tb.gateway.details.connectorConfig.convertToAdvancedFailed'), 'error');
    }
  }

  // 从高级模式转换到基础模式
  function convertAdvancedToBasic() {
    try {
      const parsed = JSON.parse(jsonConfiguration.value || '{}');
      configurationJson.value = parsed;
    } catch (error) {
      console.error('JSON 格式错误:', error);
      showMessage(t('tb.gateway.details.connectorConfig.jsonFormatError'), 'error');
      // 回退到高级模式
      mode.value = CONNECTOR_MODE.ADVANCED;
    }
  }

  function reset() {
    if (!initialConnector.value) {
      console.warn('没有找到初始配置，无法重置');
      return;
    }

    Modal.confirm({
      title: t('tb.gateway.details.connectorConfig.resetConfirm'),
      content: t('tb.gateway.details.connectorConfig.resetConfirmContent'),
      okText: t('tb.gateway.details.connectorConfig.resetConfirmOk'),
      cancelText: t('tb.gateway.details.connectorConfig.resetConfirmCancel'),
      okType: 'danger',
      onOk() {
        try {
          // 重置配置数据，这会触发 computed 属性重新计算，从而让所有子组件接收到初始配置
          configurationJson.value = cloneDeep(initialConnector.value!.value.configurationJson);

          // 触发父组件的重置事件，让父组件更新 connector 数据
          emit('reset', cloneDeep(initialConnector.value!));
          console.log('配置已重置到初始状态');
        } catch (error) {
          console.error('重置配置时出错:', error);
        }
      },
    });
  }

  async function save() {
    if (saving.value) return;

    saving.value = true;
    try {
      const config = cloneDeep(props.connector.value);
      let mergedConfigurationJson: Partial<OpcuaGatewayConfig> = {
        mapping: [],
      };

      if (mode.value === CONNECTOR_MODE.ADVANCED) {
        // 高级模式：从 JSON 编辑器获取配置
        try {
          const parsed = JSON.parse(jsonConfiguration.value || '{}');
          mergedConfigurationJson = parsed;

          // 获取 General 组件的基本信息
          const generalComp = componentRefs.value['general'];
          if (generalComp && typeof generalComp.getConfiguration === 'function') {
            const generalResult = await generalComp.getConfiguration();
            Object.assign(config, generalResult);
          }
        } catch (error) {
          showMessage(t('tb.gateway.details.connectorConfig.jsonFormatError'), 'error');
          return;
        }
      } else {
        // 基础模式：收集所有组件的配置
        for (const [key, comp] of Object.entries(componentRefs.value || {})) {
          if (!comp || typeof (comp as any).getConfiguration !== 'function') continue;

          try {
            const result = await (comp as any).getConfiguration();
            console.log(key, result);

            if (key === 'general') {
              // General组件返回的是connector的基本信息
              Object.assign(config, result);
            } else if (result.configurationJson) {
              // 其他组件返回的是configurationJson的部分
              if (result.configurationJson.server) {
                mergedConfigurationJson.server = result.configurationJson.server;
              }
              if (result.configurationJson.mapping) {
                mergedConfigurationJson.mapping = result.configurationJson.mapping;
              }
            }
          } catch (error) {
            console.error(`Error getting configuration from ${key}:`, error);
            throw error;
          }
        }
      }

      config.configurationJson = mergedConfigurationJson;
      config.mode = mode.value;
      console.log('Final config :>> ', config);

      emit('save', config, props.connector);
    } catch (error) {
      console.error('保存配置时出错:', error);
      throw error;
    } finally {
      saving.value = false;
    }
  }
</script>

<style scoped>
  .tab-content {
    padding: 0;
  }

  .footer {
    margin-top: 16px;
    text-align: right;
  }
</style>
