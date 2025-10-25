import { REPORT_TYPE } from '/@/enums/gateway';

export enum SECURITY_TYPE {
  ANONYMOUS = 'anonymous',
  BASIC = 'basic',
  CERTIFICATES = 'certificates',
}

export enum CONVERTER_TYPE {
  JSON = 'json',
  BYTES = 'bytes',
  CUSTOM = 'custom',
}

export enum EXPRESSION_SOURCE_TYPE {
  MESSAGE = 'message',
  TOPIC = 'topic',
  CONSTANT = 'constant',
}

export enum DATA_TYPE {
  STRING = 'string',
  DOUBLE = 'double',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
}

export enum CONVERTER_FIELD_TYPE {
  ATTRIBUTES = 'attributes',
  TIMESERIES = 'timeseries',
}

export enum RPC_TYPE {
  ONE_WAY = 'oneWay',
  TWO_WAY = 'twoWay',
}

export enum REQUEST_TYPE {
  CONNECT_REQUEST = 'connectRequests',
  DISCONNECT_REQUEST = 'disconnectRequests',
  ATTRIBUTE_REQUEST = 'attributeRequests',
  ATTRIBUTE_UPDATE = 'attributeUpdates',
  RPC_COMMAND = 'serverSideRpc',
}

export interface MqttGatewayConfig {
  broker: BrokerConfig;
  mapping: MappingConfig[];
  requestsMapping: RequestsMapping;
}

export interface BrokerConfig {
  host: string;
  port: number;
  clientId: string;
  version: number;
  maxMessageNumberPerWorker: number;
  maxNumberOfWorkers: number;
  sendDataOnlyOnChange: boolean;
  security: SecurityConfig;
}

export interface SecurityConfig {
  type: SECURITY_TYPE;

  // type 为base
  password?: string;
  username?: string;
  // type 为certificates
  pathToCACert?: string;
  pathToClientCert?: string;
  pathToPrivateKey?: string;
}

export interface MappingConfig {
  topicFilter: string;
  subscriptionQos: number;
  reportStrategy?: ReportStrategy;
  converter: ConverterConfig;
}

export interface ReportStrategy {
  type: REPORT_TYPE;
  reportPeriod?: number;
}

export interface ConverterConfig {
  type: CONVERTER_TYPE;
  deviceInfo: DeviceInfoConfig;
  sendDataOnlyOnChange: boolean;
  timeout: number;
  attributes?: AttributeMapping[];
  timeseries?: AttributeMapping[];
  extension?: string;
  cached?: boolean;
  extensionConfig?: Record<string, any>;
}

export interface DeviceInfoConfig {
  deviceNameExpressionSource?: EXPRESSION_SOURCE_TYPE;
  deviceNameExpression?: string;
  deviceProfileExpressionSource?: EXPRESSION_SOURCE_TYPE;
  deviceProfileExpression?: string;
}

export interface AttributeMapping {
  type: DATA_TYPE;
  key: string;
  value: string;
  reportStrategy?: {
    type: REPORT_TYPE;
    reportPeriod?: number;
  };
}

export interface RequestsMapping {
  connectRequests: RequestData[];
  disconnectRequests: RequestData[];
  attributeRequests: RequestData[];
  attributeUpdates: RequestData[];
  serverSideRpc: RequestData[];
}

export interface RequestData {
  // 基础类型
  type: REQUEST_TYPE;
  deviceInfo?: DeviceInfoConfig;

  // connectRequest & disconnectRequest & attributeRequest
  topicFilter?: string;

  // attributeRequest & attributeUpdate
  topicExpression?: string;
  valueExpression?: string;
  retain?: boolean;

  // attributeRequest
  attributeNameExpressionSource?: string;
  attributeNameExpression?: string;

  // attributeUpdate
  deviceNameFilter?: string;
  attributeFilter?: string;

  // rpcCommand
  methodFilter?: string;
  requestTopicExpression?: string;
  responseTopicExpression?: string;
  responseTimeout?: number;
  rpcType?: RPC_TYPE;
  responseTopicQoS?: number;
}

export const QOS_OPTIONS = [
  { label: '0 - At most once', value: 0 },
  { label: '1 - At least once', value: 1 },
  { label: '2 - Exactly once', value: 2 },
];

export const PAYLOAD_TYPE_OPTIONS = [
  { label: 'JSON', value: CONVERTER_TYPE.JSON },
  { label: 'Bytes', value: CONVERTER_TYPE.BYTES },
  { label: 'Custom', value: CONVERTER_TYPE.CUSTOM },
];

export const EXPRESSION_SOURCE_OPTIONS_WITH_BYTES = [
  { label: 'Message', value: EXPRESSION_SOURCE_TYPE.MESSAGE },
  { label: 'Constant', value: EXPRESSION_SOURCE_TYPE.CONSTANT },
];

export const EXPRESSION_SOURCE_OPTIONS = [
  { label: 'Message', value: EXPRESSION_SOURCE_TYPE.MESSAGE },
  { label: 'Topic', value: EXPRESSION_SOURCE_TYPE.TOPIC },
  { label: 'Constant', value: EXPRESSION_SOURCE_TYPE.CONSTANT },
];

export const DATA_TYPE_OPTIONS = [
  { label: '字符串', value: DATA_TYPE.STRING },
  { label: '双精度浮点数', value: DATA_TYPE.DOUBLE },
  { label: '整数', value: DATA_TYPE.INTEGER },
  { label: '布尔值', value: DATA_TYPE.BOOLEAN },
];

export const MQTT_VERSION_OPTIONS = [
  { label: '3.1', value: 3 },
  { label: '3.1.1', value: 4 },
  { label: '5', value: 5 },
];

export const SECURITY_TYPE_OPTIONS = [
  { label: 'Anonymous', value: SECURITY_TYPE.ANONYMOUS },
  { label: 'Basic', value: SECURITY_TYPE.BASIC },
  { label: 'Certificates', value: SECURITY_TYPE.CERTIFICATES },
];

export const REQUEST_TYPE_OPTIONS = [
  { label: 'Connect request', value: REQUEST_TYPE.CONNECT_REQUEST },
  { label: 'Disconnect request', value: REQUEST_TYPE.DISCONNECT_REQUEST },
  { label: 'Attribute request', value: REQUEST_TYPE.ATTRIBUTE_REQUEST },
  { label: 'Attribute update', value: REQUEST_TYPE.ATTRIBUTE_UPDATE },
  { label: 'RPC command', value: REQUEST_TYPE.RPC_COMMAND },
];
