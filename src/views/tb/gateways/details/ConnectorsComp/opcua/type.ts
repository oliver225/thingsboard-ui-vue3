export enum SECURITY_MODE {
  NONE = 'None',
  SIGN = 'Sign',
  SIGN_AND_ENCRYPT = 'SignAndEncrypt',
}

export enum SECURITY_POLICY {
  NONE = 'None',
  BASIC128RSA15 = 'Basic128Rsa15',
  BASIC256 = 'Basic256',
  BASIC256SHA256 = 'Basic256Sha256',
}

export enum IDENTITY_TYPE {
  ANONYMOUS = 'anonymous',
  USERNAME = 'username',
  CERTIFICATES = 'certificates',
}

export interface OpcuaGatewayConfig {
  server: ServerConfig;
  mapping: MappingConfig[];
}

export interface ServerConfig {
  url: string;
  timeoutInMillis?: number;
  scanPeriodInMillis?: number;
  disableSubscriptions?: boolean;
  subCheckPeriodInMillis?: number;
  showMap?: boolean;
  security?: string;
  identity?: IdentityConfig;
}

export interface IdentityConfig {
  type: IDENTITY_TYPE;
  username?: string;
  password?: string;
  // Certificates mode
  pathToCACert?: string;
  pathToPrivateKey?: string;
  pathToClientCert?: string;
  mode?: SECURITY_MODE;
}

export enum DEVICE_INFO_SOURCE {
  PATH = 'path',
  IDENTIFIER = 'identifier',
  CONSTANT = 'constant',
}

export const DEVICE_INFO_SOURCE_OPTIONS = [
  { label: 'Path', value: DEVICE_INFO_SOURCE.PATH },
  { label: 'Identifier', value: DEVICE_INFO_SOURCE.IDENTIFIER },
  { label: 'Constant', value: DEVICE_INFO_SOURCE.CONSTANT },
];

export interface DeviceInfoConfig {
  deviceNameExpression: string;
  deviceNameExpressionSource?: DEVICE_INFO_SOURCE;
  deviceProfileExpression?: string;
  deviceProfileExpressionSource?: DEVICE_INFO_SOURCE;
}

export interface MappingConfig {
  deviceNodePattern: string;
  deviceNodeSource?: DEVICE_INFO_SOURCE;
  deviceInfo: DeviceInfoConfig;
  reportStrategy?: {
    type: string;
    reportPeriod?: number;
  };
  attributes?: AttributeMapping[];
  timeseries?: AttributeMapping[];
  rpc_methods?: RpcMethodMapping[];
  attributes_updates?: AttributeUpdateMapping[];
}

export interface AttributeMapping {
  key: string;
  type: DEVICE_INFO_SOURCE;
  value: string;
  reportStrategy?: {
    type: string;
    reportPeriod?: number;
  };
}

export interface RpcMethodMapping {
  method: string;
  arguments: RpcArgument[];
}

export interface RpcArgument {
  type: string;
  value: any;
}

export interface AttributeUpdateMapping {
  key: string;
  type: DEVICE_INFO_SOURCE;
  value: string;
}

// Table type enum
export enum TABLE_TYPE {
  ATTRIBUTES = 'attributes',
  TIMESERIES = 'timeseries',
  ATTRIBUTE_UPDATES = 'attributeUpdates',
  RPC = 'rpc',
}

// 选项构建函数 - 支持多语言
export function getSecurityModeOptions(t: (key: string) => string) {
  return [
    { label: t('tb.gateway.details.opcua.server.modeNone'), value: SECURITY_MODE.NONE },
    { label: t('tb.gateway.details.opcua.server.modeSign'), value: SECURITY_MODE.SIGN },
    { label: t('tb.gateway.details.opcua.server.modeSignAndEncrypt'), value: SECURITY_MODE.SIGN_AND_ENCRYPT },
  ];
}

export function getSecurityPolicyOptions(t: (key: string) => string) {
  return [
    // { label: t('tb.gateway.details.opcua.server.policyNone'), value: SECURITY_POLICY.NONE },
    { label: t('tb.gateway.details.opcua.server.policyBasic128Rsa15'), value: SECURITY_POLICY.BASIC128RSA15 },
    { label: t('tb.gateway.details.opcua.server.policyBasic256'), value: SECURITY_POLICY.BASIC256 },
    { label: t('tb.gateway.details.opcua.server.policyBasic256Sha256'), value: SECURITY_POLICY.BASIC256SHA256 },
  ];
}

export function getIdentityTypeOptions(t: (key: string) => string) {
  return [
    { label: t('tb.gateway.details.opcua.server.identityAnonymous'), value: IDENTITY_TYPE.ANONYMOUS },
    { label: t('tb.gateway.details.opcua.server.identityBasic'), value: IDENTITY_TYPE.USERNAME },
    { label: t('tb.gateway.details.opcua.server.identityCertificates'), value: IDENTITY_TYPE.CERTIFICATES },
  ];
}
