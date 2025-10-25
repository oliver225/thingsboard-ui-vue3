<template>
  <BasicDrawer v-bind="$attrs" showFooter @register="registerDrawer" width="60%" @ok="handleSubmit">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">
            {{ getTitle.value || t('common.loading') }}
          </span>
          <span class="text-sm">{{ t('tb.gateway.action.generalSetting') }}</span>
        </div>
      </div>
    </template>

    <template #prependContent>
      <Tabs v-model:activeKey="tabActiveKey" class="tb-detail-menu">
        <template #rightExtra>
          <Segmented v-model:value="mode" :options="modeOptions" />
        </template>
        <TabPane v-for="tab in TAB_LIST" :key="tab.key" :disabled="mode === 'advanced'">
          <template #tab>
            <Icon :icon="tab.icon" :size="16" />
            {{ tab.label }}
          </template>
        </TabPane>
      </Tabs>
    </template>
    <div class="px-4 pb-4">
      <div v-show="mode === 'basic'">
        <template v-for="tab in TAB_LIST" :key="tab.key">
          <component
            :is="componentMap[tab.key]"
            v-show="tab.key === tabActiveKey"
            v-bind="allProps[tab.key]"
            :ref="(el: any) => setComponentRef(tab.key, el)"
          />
        </template>
      </div>
      <div v-show="mode === 'advanced'">
        <CodeEditor v-model:value="jsonConfiguration" :mode="MODE.JSON" style="height: 80vh" />
      </div>
    </div>
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbDeviceProfileDetail">
  import { ref, computed, unref, shallowRef, watch } from 'vue';
  import { Tabs, TabPane, Segmented } from 'ant-design-vue';

  import { useMessage } from '/@/hooks/web/useMessage';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { Icon } from '/@/components/Icon';

  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { router } from '/@/router';

  import { Scope } from '/@/enums/telemetryEnum';
  import { CredentialsType } from '/@/enums/deviceEnum';

  import { GatewaySocketData } from '/@/api/tb/gateways/types';
  import { getAttributesByScope, kvEntity, saveEntityAttributesV1 } from '/@/api/tb/telemetry';
  import { DeviceCredentials, getDeviceCredentialsByDeviceId, updateDeviceCredentials } from '/@/api/tb/device';

  import {
    DEFAULT_TAB_ACTIVE_KEY,
    TAB_LIST,
    componentMap,
    getConfigKeyByTabKey,
    buildAdvancedJsonFromConfig,
    advancedJsonToKvEntities,
    collectBasicConfigurationFromRefs,
    buildSaveObjectFromBasic,
    buildSaveObjectFromAdvanced,
  } from './hooks';
  import { useI18n } from '/@/hooks/web/useI18n';

  const emit = defineEmits(['success', 'register']);

  const { showMessage } = useMessage();
  const { t } = useI18n('');
  const { meta } = unref(router.currentRoute);

  const mode = ref<'basic' | 'advanced'>('basic');
  const modeOptions = [
    { label: t('tb.gateway.general.mode.basic'), value: 'basic' },
    { label: t('tb.gateway.general.mode.advanced'), value: 'advanced' },
  ];

  const jsonConfiguration = ref('');

  const tabActiveKey = ref<string>(DEFAULT_TAB_ACTIVE_KEY);

  // 列表页数据
  const record = ref<GatewaySocketData>({} as GatewaySocketData);
  // 全量配置
  const configuration = ref<Array<kvEntity>>([] as Array<kvEntity>);
  // 网关设备信息
  const deviceInfo = ref<DeviceCredentials>();
  // 原始 security.type（用于判断是否变更）
  const originalSecurityType = ref<string | undefined>();
  // 组件 ref 实例
  const componentRefs = shallowRef<Record<string, any>>({});

  const getTitle = computed(() => {
    return {
      icon: meta.icon || 'ant-design:book-outlined',
      value: gatewayName.value,
    };
  });

  // 网关名称
  const gatewayName = computed(() => record.value?.latest?.ENTITY_FIELD?.name?.value ?? '');

  // Logs 当中 RemoteLogging 字段
  const remoteLoggingLevel = computed(() => {
    const item = configuration.value.find((it) => it.key === 'RemoteLoggingLevel');
    return item?.value || 'NONE';
  });

  watch(
    () => mode.value,
    async (val, oldVal) => {
      // 来回切换更新对应的 value
      if (oldVal === 'basic' && val === 'advanced') {
        const updated = await collectBasicConfigurationFromRefs(
          componentRefs.value,
          configuration.value,
          getConfigKeyByTabKey,
        );
        configuration.value = updated;
        const adv = buildAdvancedJsonFromConfig(updated);
        jsonConfiguration.value = JSON.stringify(adv, null, 2);
      } else if (oldVal === 'advanced' && val === 'basic') {
        try {
          const parsed = JSON.parse(jsonConfiguration.value || '{}');
          const kvs = advancedJsonToKvEntities(parsed, configuration.value);
          configuration.value = kvs;
        } catch (e) {
          showMessage(t('tb.gateway.message.invalidJson'), 'error');
          // revert toggle
          mode.value = 'advanced';
        }
      }
    },
  );

  const allProps = computed(() => {
    const propsMap: Record<string, any> = {};
    for (const tab of TAB_LIST) {
      propsMap[tab.key] = {
        configuration: getKeyConfiguration(tab.key),
        device: deviceInfo.value,
        gatewayName: gatewayName.value,
        remoteLoggingLevel: remoteLoggingLevel.value,
      };
    }
    return propsMap;
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data: GatewaySocketData) => {
    try {
      setDrawerProps({ loading: true });
      await clear();
      await fetchGatewaysConfig(data);
    } catch (error: any) {
      if (error.message) {
        showMessage(error.message, 'error');
      }
      console.log('error', error);
    } finally {
      setDrawerProps({ loading: false });
    }
  });

  function setComponentRef(key: string, el: any) {
    if (el) {
      componentRefs.value[key] = el;
    }
  }

  /**
   * 从全量配置当中获取key的配置
   * @param key 配置key
   */
  function getKeyConfiguration(key: string) {
    const configKey = getConfigKeyByTabKey(key);
    if (!configKey) return {};
    const config = configuration.value.find((item) => item.key === configKey);
    return config ? config.value : {};
  }

  async function handleSubmit() {
    try {
      setDrawerProps({ confirmLoading: true });

      const isInitialization = configuration.value.length;

      let configObject: Record<string, any> = {};
      if (mode.value === 'advanced') {
        try {
          configObject = buildSaveObjectFromAdvanced(jsonConfiguration.value, configuration.value, mode.value);
        } catch (e: any) {
          if (e?.code === 'INVALID_JSON') {
            showMessage(t('tb.gateway.message.invalidJson'), 'error');
            return;
          }
          throw e;
        }
      } else {
        configObject = await buildSaveObjectFromBasic(
          componentRefs.value,
          configuration.value,
          getConfigKeyByTabKey,
          mode.value,
        );
      }

      const security = (configObject as any).general_configuration?.security;

      if (isInitialization && security && security.type !== originalSecurityType.value) {
        await updateDeviceCredentials({
          ...deviceInfo.value,
          credentialsId: security.clientId,
          credentialsType:
            security.type === 'usernamePassword' ? CredentialsType.MQTT_BASIC : CredentialsType.ACCESS_TOKEN,
          credentialsValue: JSON.stringify({
            clientId: security.clientId,
            userName: security.username,
            password: security.password,
          }),
        });
      }

      await saveEntityAttributesV1(record.value.entityId, Scope.SHARED_SCOPE, configObject);

      emit('success');
      closeDrawer();
    } catch (err) {
      console.error('handleSubmit error:', err);
    } finally {
      setDrawerProps({ confirmLoading: false });
    }
  }

  async function clear() {
    record.value = {} as GatewaySocketData;
    tabActiveKey.value = DEFAULT_TAB_ACTIVE_KEY;
    componentRefs.value = {};
  }

  /**
   * 获取网关配置, 获取网关设备信息
   */
  async function fetchGatewaysConfig(data: GatewaySocketData) {
    try {
      const deviceInfoRes = await getDeviceCredentialsByDeviceId(data.entityId.id);
      deviceInfo.value = deviceInfoRes;

      let configurationRes = await getAttributesByScope(data.entityId, Scope.CLIENT_SCOPE);

      // 如果获取全部长度为0, 重新根据key 在获取一次(原系统逻辑)
      if (!configurationRes.length) {
        const keys = Array.from(new Set(TAB_LIST.map((t) => t.configKey)));
        keys.push(...['RemoteLoggingLevel', 'mode']);

        configurationRes = await getAttributesByScope(data.entityId, Scope.SHARED_SCOPE, {
          keys: keys.join(','),
        });
      }

      configuration.value = configurationRes;

      // 记录原始 security.type
      const generalItem = configurationRes.find((c) => c.key === 'general_configuration');
      originalSecurityType.value = (generalItem?.value as any)?.security?.type ?? 'accessToken';

      // 读取并设置模式
      const modeItem = configurationRes.find((c) => c.key === 'mode');
      mode.value = (modeItem?.value as any) || 'basic';

      // 如果是高级模式，构建 JSON；第一次为空也使用默认拼接
      if (mode.value === 'advanced') {
        const adv = buildAdvancedJsonFromConfig(configurationRes);
        jsonConfiguration.value = JSON.stringify(adv, null, 2);
      }

      record.value = data;
    } catch (error) {
      console.error(error);
    }
  }
</script>
<style lang="less"></style>
