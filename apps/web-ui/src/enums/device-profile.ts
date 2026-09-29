import { $t } from '@vben/locales';

export enum DeviceProfileType {
  DEFAULT = 'DEFAULT',
  SNMP = 'SNMP',
}

export enum DeviceTransportType {
  COAP = 'COAP',
  DEFAULT = 'DEFAULT',
  LWM2M = 'LWM2M',
  MQTT = 'MQTT',
  SNMP = 'SNMP',
}

export enum TransportPayloadType {
  JSON = 'JSON',
  PROTOBUF = 'PROTOBUF',
}

export enum CoapTransportDeviceType {
  DEFAULT = 'DEFAULT',
  EFENTO = 'EFENTO',
}

export enum DeviceProvisionType {
  ALLOW_CREATE_NEW_DEVICES = 'ALLOW_CREATE_NEW_DEVICES',
  CHECK_PRE_PROVISIONED_DEVICES = 'CHECK_PRE_PROVISIONED_DEVICES',
  DISABLED = 'DISABLED',
  X509_CERTIFICATE_CHAIN = 'X509_CERTIFICATE_CHAIN',
}

export enum PowerMode {
  DRX = 'DRX',
  E_DRX = 'E_DRX',
  PSM = 'PSM',
}

export function deviceProfileTypeOptions() {
  return [
    {
      label: $t('device-profile.options.type.DEFAULT'),
      value: DeviceProfileType.DEFAULT,
    },
    {
      label: $t('device-profile.options.type.SNMP'),
      value: DeviceProfileType.SNMP,
    },
  ];
}

export function deviceTransportTypeOptions() {
  return [
    {
      label: $t('device-profile.options.transport.DEFAULT'),
      value: DeviceTransportType.DEFAULT,
    },
    {
      label: $t('device-profile.options.transport.MQTT'),
      value: DeviceTransportType.MQTT,
    },
    {
      label: $t('device-profile.options.transport.COAP'),
      value: DeviceTransportType.COAP,
    },
    {
      label: $t('device-profile.options.transport.LWM2M'),
      value: DeviceTransportType.LWM2M,
    },
    {
      label: $t('device-profile.options.transport.SNMP'),
      value: DeviceTransportType.SNMP,
    },
  ];
}

export function transportPayloadTypeOptions() {
  return [
    {
      label: $t('device-profile.options.payload.JSON'),
      value: TransportPayloadType.JSON,
    },
    {
      label: $t('device-profile.options.payload.PROTOBUF'),
      value: TransportPayloadType.PROTOBUF,
    },
  ];
}

export function coapTransportDeviceTypeOptions() {
  return [
    {
      label: $t('device-profile.options.coapDeviceType.DEFAULT'),
      value: CoapTransportDeviceType.DEFAULT,
    },
    {
      label: $t('device-profile.options.coapDeviceType.EFENTO'),
      value: CoapTransportDeviceType.EFENTO,
    },
  ];
}

export function deviceProvisionTypeOptions() {
  return [
    {
      label: $t('device-profile.options.provision.DISABLED'),
      value: DeviceProvisionType.DISABLED,
    },
    {
      label: $t('device-profile.options.provision.ALLOW_CREATE_NEW_DEVICES'),
      value: DeviceProvisionType.ALLOW_CREATE_NEW_DEVICES,
    },
    {
      label: $t(
        'device-profile.options.provision.CHECK_PRE_PROVISIONED_DEVICES',
      ),
      value: DeviceProvisionType.CHECK_PRE_PROVISIONED_DEVICES,
    },
    {
      label: $t('device-profile.options.provision.X509_CERTIFICATE_CHAIN'),
      value: DeviceProvisionType.X509_CERTIFICATE_CHAIN,
    },
  ];
}

export function powerModeOptions() {
  return [
    { label: $t('device-profile.options.powerMode.DRX'), value: PowerMode.DRX },
    { label: $t('device-profile.options.powerMode.PSM'), value: PowerMode.PSM },
    {
      label: $t('device-profile.options.powerMode.E_DRX'),
      value: PowerMode.E_DRX,
    },
  ];
}
