import type {
  AiModel,
  AiModelParameter,
  AiProviderConfig,
} from '#/api/tb/ai-model';

import { AiProvider } from '../../../../enums/ai-provider';
import { modelFields, openAiDefaultBaseUrl, providerFields } from './config';

export interface AiModelFormValues extends Partial<
  Record<AiModelParameter, null | number>
> {
  name: string;
  provider: AiProvider;
  modelId: string;
}

export interface AiModelConnectionValues extends Omit<
  AiProviderConfig,
  'auth'
> {
  authType?: 'BASIC' | 'NONE' | 'TOKEN';
  username?: string;
  password?: string;
  token?: string;
}

export function toConnectionFormValues(
  provider: AiProvider,
  config?: AiProviderConfig,
): AiModelConnectionValues {
  return {
    ...Object.fromEntries(
      providerFields[provider].map((field) => [field, config?.[field] ?? '']),
    ),
    baseUrl:
      config?.baseUrl ??
      (provider === AiProvider.OPENAI ? openAiDefaultBaseUrl : ''),
    fileName: config?.fileName ?? '',
    authType: config?.auth?.type ?? 'NONE',
    username: config?.auth?.username ?? '',
    password: config?.auth?.password ?? '',
    token: config?.auth?.token ?? '',
  };
}

export function isServiceAccountKeyValid(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const credentials = JSON.parse(value);
    return (
      typeof credentials?.private_key === 'string' &&
      !!credentials.private_key.trim() &&
      typeof credentials?.client_email === 'string' &&
      !!credentials.client_email.trim()
    );
  } catch {
    return false;
  }
}

/** 仅提交当前供应商支持的字段，显式清除被清空的可选参数。 */
export function toAiModelPayload(
  formValues: AiModelFormValues,
  connection: AiModelConnectionValues,
  record: AiModel | null,
): AiModel {
  const providerConfig: AiProviderConfig = Object.fromEntries(
    providerFields[formValues.provider].map((field) => [
      field,
      connection[field]?.trim() || undefined,
    ]),
  );
  if (
    formValues.provider === AiProvider.GOOGLE_VERTEX_AI_GEMINI &&
    connection.fileName
  ) {
    providerConfig.fileName = connection.fileName;
  }
  if (formValues.provider === AiProvider.OLLAMA) {
    switch (connection.authType) {
      case 'BASIC': {
        providerConfig.auth = {
          type: 'BASIC',
          username: connection.username?.trim(),
          password: connection.password?.trim(),
        };
        break;
      }
      case 'TOKEN': {
        providerConfig.auth = {
          type: 'TOKEN',
          token: connection.token?.trim(),
        };
        break;
      }
      default: {
        providerConfig.auth = { type: 'NONE' };
      }
    }
  }
  return {
    ...record,
    name: formValues.name.trim(),
    modelType: 'CHAT',
    configuration: {
      provider: formValues.provider,
      modelId: formValues.modelId.trim(),
      providerConfig,
      ...Object.fromEntries(
        modelFields[formValues.provider].map((field) => [
          field,
          formValues[field] ?? null,
        ]),
      ),
    },
  };
}
