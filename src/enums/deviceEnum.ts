export enum TransportType {
  DEFAULT = 'DEFAULT',
  MQTT = 'MQTT',
  COAP = 'COAP',
  TCP = 'TCP',
  LWM2M = 'LWM2M',
  SNMP = 'SNMP',
}

export enum CredentialsType {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  X509_CERTIFICATE = 'X509_CERTIFICATE',
  MQTT_BASIC = 'MQTT_BASIC',
  LWM2M_CREDENTIALS = 'LWM2M_CREDENTIALS',
}

export enum ProvisionType {
  DISABLED = 'DISABLED',
  ALLOW_CREATE_NEW_DEVICES = 'ALLOW_CREATE_NEW_DEVICES',
  CHECK_PRE_PROVISIONED_DEVICES = 'CHECK_PRE_PROVISIONED_DEVICES',
  X509_CERTIFICATE_CHAIN = 'X509_CERTIFICATE_CHAIN',
}

export const TRANSPORT_TYPE_OPTIONS = [
  { value: TransportType.DEFAULT, label: '默认' },
  { value: TransportType.MQTT, label: 'MQTT' },
  { value: TransportType.COAP, label: 'CoAP' },
  { value: TransportType.TCP, label: 'TCP' },
  { value: TransportType.LWM2M, label: 'LWM2M' },
  { value: TransportType.SNMP, label: 'SNMP' },

];

export const PROVISION_TYPE_OPTIONS = [
  { value: ProvisionType.DISABLED, label: '禁用' },
  { value: ProvisionType.ALLOW_CREATE_NEW_DEVICES, label: '允许创建新设备' },
  { value: ProvisionType.CHECK_PRE_PROVISIONED_DEVICES, label: '检查与配置的设备' },
  { value: ProvisionType.X509_CERTIFICATE_CHAIN, label: 'X509证书链' },

];