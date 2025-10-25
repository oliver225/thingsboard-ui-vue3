import { defineAsyncComponent } from 'vue';
import { kvEntity } from '/@/api/tb/telemetry';
import {
  DEFAULT_GENERAL_FORM,
  DEFAULT_STORAGE_FORM,
  DEFAULT_GRPC_FORM,
  DEFAULT_LOGS_FORM,
  DEFAULT_STATISTICS_FORM,
  DEFAULT_OTHER_FORM,
} from './components/default';
import { LOCAL_TABS } from './components/enums';

// 默认选中tabs key
export const DEFAULT_TAB_ACTIVE_KEY = 'General';

// 配置 tabs list
export const TAB_LIST = [
  { key: 'General', label: 'General', icon: 'ant-design:setting-outlined', configKey: 'general_configuration' },
  { key: 'Logs', label: 'Logs', icon: 'ant-design:profile-outlined', configKey: 'logs_configuration' },
  { key: 'Storage', label: 'Storage', icon: 'ant-design:database-outlined', configKey: 'storage_configuration' },
  { key: 'GRPC', label: 'GRPC', icon: 'ant-design:api-outlined', configKey: 'grpc_configuration' },
  {
    key: 'Statistics',
    label: 'Statistics',
    icon: 'ant-design:bar-chart-outlined',
    configKey: 'general_configuration',
  },
  { key: 'Other', label: 'Other', icon: 'ant-design:appstore-add-outlined', configKey: 'general_configuration' },
];

// 组件Map
export const componentMap: Record<string, any> = {};

const modules = import.meta.glob('./components/*.vue');
for (const path in modules) {
  const key = path.replace('./components/', '').replace('.vue', '');
  componentMap[key] = defineAsyncComponent(modules[path] as any);
}

// 基于 tab key 获取后端配置键
export function getConfigKeyByTabKey(key: string) {
  return TAB_LIST.find((t) => t.key === key)?.configKey;
}

function extractDir(path: string) {
  if (!path) return './logs';
  const normalized = path.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx > -1 ? normalized.slice(0, idx) : normalized;
}

// Build Advanced JSON from kv configuration array
export function buildAdvancedJsonFromConfig(configs: Array<kvEntity>) {
  const map: Record<string, any> = {};
  for (const item of configs || []) {
    map[item.key as string] = item.value;
  }

  const general = map.general_configuration || {};
  const storage = map.storage_configuration || DEFAULT_STORAGE_FORM;
  const grpc = map.grpc_configuration || DEFAULT_GRPC_FORM;
  const logsConf = map.logs_configuration || DEFAULT_LOGS_FORM;
  const remoteLevel = map.RemoteLoggingLevel || 'NONE';

  const thingsboard = {
    host: general.host ?? DEFAULT_GENERAL_FORM.host,
    port: general.port ?? DEFAULT_GENERAL_FORM.port,
    remoteShell: general.remoteShell ?? DEFAULT_GENERAL_FORM.remoteShell,
    remoteConfiguration: general.remoteConfiguration ?? DEFAULT_GENERAL_FORM.remoteConfiguration,
    checkConnectorsConfigurationInSeconds:
      general.checkConnectorsConfigurationInSeconds ?? DEFAULT_OTHER_FORM.checkConnectorsConfigurationInSeconds,
    statistics: general.statistics ?? DEFAULT_STATISTICS_FORM,
    maxPayloadSizeBytes: general.maxPayloadSizeBytes ?? DEFAULT_OTHER_FORM.maxPayloadSizeBytes,
    minPackSendDelayMS: general.minPackSendDelayMS ?? DEFAULT_OTHER_FORM.minPackSendDelayMS,
    minPackSizeToSend: general.minPackSizeToSend ?? DEFAULT_OTHER_FORM.minPackSizeToSend,
    handleDeviceRenaming: general.handleDeviceRenaming ?? DEFAULT_GENERAL_FORM.handleDeviceRenaming,
    checkingDeviceActivity: general.checkingDeviceActivity ?? DEFAULT_OTHER_FORM.checkingDeviceActivity,
    security: general.security ?? DEFAULT_GENERAL_FORM.security,
    qos: general.qos ?? DEFAULT_OTHER_FORM.qos,
  };

  function toAdvancedLogs(logs: any) {
    const fmt = logs?.formatters?.LogFormatter || {};
    const handlers = logs?.handlers || {};
    const loggers = logs?.loggers || {};
    const names = LOCAL_TABS.map((item) => item.value);
    const local: any = {};
    for (const name of names) {
      const handlerKey = `${name}Handler`;
      const h = handlers[handlerKey] || {};
      const l = loggers[name] || {};
      local[name] = {
        logLevel: l.level || 'INFO',
        filePath: extractDir(h.filename || './logs/service.log') || './logs',
        backupCount: h.backupCount ?? 7,
        savingTime: h.interval ?? 3,
        savingPeriod: h.when ?? 'D',
      };
    }
    return {
      local,
      logFormat: fmt.format || DEFAULT_LOGS_FORM.formatters.LogFormatter.format,
      dateFormat: fmt.datefmt || DEFAULT_LOGS_FORM.formatters.LogFormatter.datefmt,
      logLevel: remoteLevel,
    };
  }

  const adv = {
    thingsboard,
    storage: storage,
    grpc: grpc,
    connectors: [],
    logs: toAdvancedLogs(logsConf),
  };

  return adv;
}

// Convert Advanced JSON to kv entries, preserving unknown keys by existingConfiguration
export function advancedJsonToKvEntities(advanced: any, existingConfiguration: Array<kvEntity>): Array<kvEntity> {
  const toSave: Array<kvEntity> = [] as any;

  if (advanced?.thingsboard && typeof advanced.thingsboard === 'object') {
    const tb = advanced.thingsboard;
    const general_configuration = {
      host: tb.host,
      port: tb.port,
      remoteShell: !!tb.remoteShell,
      remoteConfiguration: !!tb.remoteConfiguration,
      checkConnectorsConfigurationInSeconds: tb.checkConnectorsConfigurationInSeconds,
      statistics: tb.statistics,
      maxPayloadSizeBytes: tb.maxPayloadSizeBytes,
      minPackSendDelayMS: tb.minPackSendDelayMS,
      minPackSizeToSend: tb.minPackSizeToSend,
      handleDeviceRenaming: tb.handleDeviceRenaming,
      checkingDeviceActivity: tb.checkingDeviceActivity,
      security: tb.security,
      qos: tb.qos,
    } as any;
    toSave.push({ key: 'general_configuration', value: general_configuration } as any);
  }

  if (advanced?.storage) {
    toSave.push({ key: 'storage_configuration', value: advanced.storage } as any);
  }
  if (advanced?.grpc) {
    toSave.push({ key: 'grpc_configuration', value: advanced.grpc } as any);
  }
  if (advanced?.logs && advanced.logs.logLevel) {
    toSave.push({ key: 'RemoteLoggingLevel', value: advanced.logs.logLevel } as any);
  }

  const preservedKeys = new Set(toSave.map((i) => i.key).concat(['mode']));
  const rest = (existingConfiguration || []).filter((c) => !preservedKeys.has(c.key as any));
  return [...rest, ...toSave];
}

// Collect configuration from all basic tab components and merge into kv list
export async function collectBasicConfigurationFromRefs(
  componentRefs: Record<string, any>,
  currentConfiguration: Array<kvEntity>,
  getConfigKeyByTabKeyFn: (key: string) => string | undefined,
): Promise<Array<kvEntity>> {
  const cloneConfig = (currentConfiguration ? JSON.parse(JSON.stringify(currentConfiguration)) : []) as Array<kvEntity>;
  for (const [key, comp] of Object.entries(componentRefs || {})) {
    if (!comp || typeof (comp as any).getConfiguration !== 'function') continue;
    const result = await (comp as any).getConfiguration();
    const { __special_keys__, ...partialConfig } = result || {};

    // 处理特殊键，如 RemoteLoggingLevel
    if (__special_keys__) {
      for (const [specialKey, specialValue] of Object.entries(__special_keys__)) {
        const idx = cloneConfig.findIndex((item) => item.key === specialKey);
        if (idx !== -1) (cloneConfig[idx] as any).value = specialValue as any;
        else cloneConfig.push({ key: specialKey, value: specialValue as any } as any);
      }
    }

    // 处理常规配置块
    const configKey = getConfigKeyByTabKeyFn(key);
    if (!configKey) continue;

    // 更新 Configuration
    const targetIndex = cloneConfig.findIndex((item) => item.key === configKey);
    if (targetIndex !== -1) {
      (cloneConfig[targetIndex] as any).value = {
        ...(cloneConfig[targetIndex] as any).value,
        ...(partialConfig || {}),
      } as any;
    } else {
      cloneConfig.push({ key: configKey, value: partialConfig as any } as any);
    }
  }
  return cloneConfig;
}

// Build final object to save from basic components (single API payload)
export async function buildSaveObjectFromBasic(
  componentRefs: Record<string, any>,
  currentConfiguration: Array<kvEntity>,
  getConfigKeyByTabKeyFn: (key: string) => string | undefined,
  mode: 'basic' | 'advanced' | any,
) {
  const kvs = await collectBasicConfigurationFromRefs(componentRefs, currentConfiguration, getConfigKeyByTabKeyFn);
  const obj = kvArrayToObject(kvs);
  obj['mode'] = mode;
  return obj as Record<string, any>;
}

// Build final object to save from advanced json (single API payload)
export function buildSaveObjectFromAdvanced(
  jsonStr: string,
  existingConfiguration: Array<kvEntity>,
  mode: 'basic' | 'advanced',
) {
  let parsed: any = {};
  try {
    parsed = JSON.parse(jsonStr || '{}');
  } catch (e) {
    const err = new Error('INVALID_JSON');
    // @ts-ignore
    (err as any).code = 'INVALID_JSON';
    throw err;
  }
  const kvs = advancedJsonToKvEntities(parsed, existingConfiguration);
  const obj = kvArrayToObject(kvs);
  obj['mode'] = mode;
  return obj as Record<string, any>;
}

export function kvArrayToObject(configs: Array<kvEntity>) {
  return (configs || []).reduce(
    (acc, item) => {
      acc[item.key as string] = item.value;
      return acc;
    },
    {} as Record<string, any>,
  );
}
