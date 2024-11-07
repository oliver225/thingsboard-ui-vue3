export enum ResourceType {
  LWM2M_MODEL = 'LWM2M_MODEL',
  PKCS_12 = 'PKCS_12',
  JKS = 'JKS',
  JS_MODULE = 'JS_MODULE',
  // LATEST_TELEMETRY = 'LATEST_TELEMETRY',
}

export const RESOURCE_TYPE_OPTIONS = [
  { value: ResourceType.LWM2M_MODEL, label: 'LWM2M模型' },
  { value: ResourceType.PKCS_12, label: 'PKCS #12' },
  { value: ResourceType.JKS, label: 'JSK' },
  { value: ResourceType.JS_MODULE, label: 'JS 模块' },
];
