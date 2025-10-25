export enum CONNECTORS_TYPE {
  MQTT = 'mqtt',
  MODBUS = 'modbus',
  GRPC = 'grpc',
  OPCUA = 'opcua',
  BLE = 'ble',
  REQUEST = 'request',
  CAN = 'can',
  BACNET = 'bacnet',
  ODBC = 'odbc',
  REST = 'rest',
  SNMP = 'snmp',
  FTP = 'ftp',
  SOCKET = 'socket',
  XMPP = 'xmpp',
  OCPP = 'ocpp',
  CUSTOM = 'custom',
  KNX = 'knx',
}

export enum LOGGING_LEVEL_ENUM {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  NONE = 'NONE',
}

export const CONNECTORS_TYPE_OPTIONS = [
  { label: 'MQTT', value: CONNECTORS_TYPE.MQTT },
  { label: 'MODBUS', value: CONNECTORS_TYPE.MODBUS },
  // { label: 'GRPC', value: CONNECTORS_TYPE.GRPC },
  { label: 'OPCUA', value: CONNECTORS_TYPE.OPCUA },
  // { label: 'BLE', value: CONNECTORS_TYPE.BLE },
  // { label: 'REQUEST', value: CONNECTORS_TYPE.REQUEST },
  // { label: 'CAN', value: CONNECTORS_TYPE.CAN },
  // { label: 'BACNET', value: CONNECTORS_TYPE.BACNET },
  // { label: 'ODBC', value: CONNECTORS_TYPE.ODBC },
  // { label: 'REST', value: CONNECTORS_TYPE.REST },
  // { label: 'SNMP', value: CONNECTORS_TYPE.SNMP },
  // { label: 'FTP', value: CONNECTORS_TYPE.FTP },
  // { label: 'SOCKET', value: CONNECTORS_TYPE.SOCKET },
  // { label: 'XMPP', value: CONNECTORS_TYPE.XMPP },
  // { label: 'OCPP', value: CONNECTORS_TYPE.OCPP },
  // { label: 'CUSTOM', value: CONNECTORS_TYPE.CUSTOM },
  // { label: 'KNX', value: CONNECTORS_TYPE.KNX },
];

export const LOGGING_LEVEL_OPTIONS = [
  { label: 'TRACE', value: LOGGING_LEVEL_ENUM.TRACE },
  { label: 'DEBUG', value: LOGGING_LEVEL_ENUM.DEBUG },
  { label: 'INFO', value: LOGGING_LEVEL_ENUM.INFO },
  { label: 'WARNING', value: LOGGING_LEVEL_ENUM.WARNING },
  { label: 'ERROR', value: LOGGING_LEVEL_ENUM.ERROR },
  { label: 'CRITICAL', value: LOGGING_LEVEL_ENUM.CRITICAL },
  { label: 'NONE', value: LOGGING_LEVEL_ENUM.NONE },
];

export interface Connectors {
  key: string;
  value: ConnectorBaseInfo;
  lastUpdateTs: number;

  __enabled?: boolean;
  __errorsCount?: number;
  __skipSync?: boolean;
}
export enum CONNECTOR_MODE {
  BASIC = 'basic',
  ADVANCED = 'advanced',
}

export const CONNECTOR_MODE_OPTIONS = [
  { label: '基础模式', value: CONNECTOR_MODE.BASIC },
  { label: '高级模式', value: CONNECTOR_MODE.ADVANCED },
];

// 新增 connection 的form
export interface ConnectorBaseInfo {
  type: CONNECTORS_TYPE;
  name: string;
  useDefaults: boolean;
  logLevel: LOGGING_LEVEL_ENUM;
  mode: CONNECTOR_MODE;

  configVersion: string;
  configuration: string;
  configurationJson: any;
  sendDataOnlyOnChange: boolean;
  ts: number;

  enableRemoteLogging?: boolean;
  reportStrategy?: {
    reportPeriod: number;
    type: string;
  };

  __isReportStrategy?: boolean;
}
