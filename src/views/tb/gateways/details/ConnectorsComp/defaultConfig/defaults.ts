import mqttConfig from './mqtt.json';
import modbusConfig from './modbus.json';
import opcuaConfig from './opcua.json';

// 连接器默认配置构建器（builders）
// 按连接器类型添加新的构建器，便于扩展默认配置

export interface DefaultConfigContext {
  name?: string;
  version?: string;
}

type DefaultConfigBuilder = () => any;

// MQTT 默认配置（基于用户提供的模板）
const mqttDefaultBuilder: DefaultConfigBuilder = () => {
  return mqttConfig;
};

// Modbus 默认配置（基于用户提供的模板）
const modbusDefaultBuilder: DefaultConfigBuilder = () => {
  return modbusConfig;
};

// OPC UA 默认配置（基于用户提供的模板）
const opcuaDefaultBuilder: DefaultConfigBuilder = () => {
  return opcuaConfig;
};

// 默认配置构建器注册表（按类型，小写 key）
const defaultConfigRegistry: Record<string, DefaultConfigBuilder> = {
  mqtt: mqttDefaultBuilder,
  modbus: modbusDefaultBuilder,
  opcua: opcuaDefaultBuilder,
};

export function buildDefaultConfiguration(type: string) {
  const key = (type || '').toLowerCase();
  const builder = defaultConfigRegistry[key];
  if (!builder) return {};
  // 深拷贝以避免外部修改影响原始对象
  return JSON.parse(JSON.stringify(builder()));
}
