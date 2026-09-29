import type { NodeFormDefinition } from '../../types';

import type { FormValidationIssue } from '#/types/form';

import { $t } from '#/locales';

export interface MappingRow {
  key: string;
  value: string;
}

export function toMappingRows(value?: Record<string, string>): MappingRow[] {
  return Object.entries(value ?? {}).map(([key, value]) => ({ key, value }));
}

export function toMapping(rows: MappingRow[] = []) {
  return Object.fromEntries(rows.map(({ key, value }) => [key.trim(), value]));
}

export function validateMapping(
  rows: MappingRow[] = [],
  fieldName: string,
): FormValidationIssue[] {
  const keys = rows.map(({ key }) => key?.trim());
  return new Set(keys).size === keys.length
    ? []
    : [
        {
          fieldName,
          message: $t('rule-chain.config.duplicateKey'),
        },
      ];
}

/** 表单使用映射行，接口使用对象；统一回填、保存及重复源键校验。 */
export function createMappingHandlers(field: string) {
  return {
    getValues(configuration) {
      return { ...configuration, [field]: toMappingRows(configuration[field]) };
    },
    toConfiguration(configuration) {
      return { ...configuration, [field]: toMapping(configuration[field]) };
    },
    validate(configuration) {
      return validateMapping(configuration[field], `configuration.${field}`);
    },
  } satisfies Pick<
    NodeFormDefinition,
    'getValues' | 'toConfiguration' | 'validate'
  >;
}

interface Credentials {
  type: 'anonymous' | 'basic' | 'cert.PEM';
  username?: string;
  password?: string;
  caCert?: string;
  caCertFileName?: string;
  cert?: string;
  certFileName?: string;
  privateKey?: string;
  privateKeyFileName?: string;
}

export function toCredentials(value: Credentials) {
  if (value.type === 'anonymous') return { type: value.type };
  if (value.type === 'basic')
    return {
      type: value.type,
      username: value.username,
      password: value.password,
    };
  return {
    type: value.type,
    password: value.password,
    caCert: value.caCert,
    caCertFileName: value.caCertFileName,
    cert: value.cert,
    certFileName: value.certFileName,
    privateKey: value.privateKey,
    privateKeyFileName: value.privateKeyFileName,
  };
}

export function validateCredentials(value: Credentials): FormValidationIssue[] {
  if (value?.type !== 'cert.PEM') return [];
  const ca = !!value.caCert?.trim();
  const cert = !!value.cert?.trim();
  const key = !!value.privateKey?.trim();
  if ((ca || (cert && key)) && cert === key) return [];
  return [
    {
      fieldName: 'configuration.credentials.caCert',
      message: $t('rule-chain.config.certificateRequired'),
    },
  ];
}
