import type { AiModelParameter, AiProviderConfig } from '#/api/tb/ai-model';

import { AiProvider } from '../../../../enums/ai-provider';

export type AiProviderField = Exclude<
  keyof AiProviderConfig,
  'auth' | 'fileName'
>;
export const openAiDefaultBaseUrl = 'https://api.openai.com/v1';

const openAiFields: AiModelParameter[] = [
  'temperature',
  'topP',
  'frequencyPenalty',
  'presencePenalty',
  'maxOutputTokens',
];
const geminiFields: AiModelParameter[] = [...openAiFields, 'topK'];
export const providerFields: Record<AiProvider, AiProviderField[]> = {
  OPENAI: ['baseUrl', 'apiKey'],
  AZURE_OPENAI: ['apiKey', 'endpoint', 'serviceVersion'],
  GOOGLE_AI_GEMINI: ['apiKey'],
  GOOGLE_VERTEX_AI_GEMINI: ['projectId', 'location', 'serviceAccountKey'],
  MISTRAL_AI: ['apiKey'],
  ANTHROPIC: ['apiKey'],
  AMAZON_BEDROCK: ['region', 'accessKeyId', 'secretAccessKey'],
  GITHUB_MODELS: ['personalAccessToken'],
  OLLAMA: ['baseUrl'],
};
export const modelFields: Record<AiProvider, AiModelParameter[]> = {
  OPENAI: openAiFields,
  AZURE_OPENAI: openAiFields,
  GOOGLE_AI_GEMINI: geminiFields,
  GOOGLE_VERTEX_AI_GEMINI: geminiFields,
  MISTRAL_AI: openAiFields,
  GITHUB_MODELS: openAiFields,
  ANTHROPIC: ['temperature', 'topP', 'topK', 'maxOutputTokens'],
  AMAZON_BEDROCK: ['temperature', 'topP', 'maxOutputTokens'],
  OLLAMA: ['temperature', 'topP', 'topK', 'maxOutputTokens', 'contextLength'],
};
export const secretFields = new Set([
  'apiKey',
  'personalAccessToken',
  'secretAccessKey',
  'serviceAccountKey',
]);
export function isRequiredProviderField(
  provider: AiProvider,
  field: AiProviderField,
  baseUrl?: string,
) {
  if (field === 'serviceVersion') return false;
  if (provider === AiProvider.OPENAI && field === 'apiKey') {
    return (
      !baseUrl?.trim() ||
      baseUrl.trim().replace(/\/+$/, '') === openAiDefaultBaseUrl
    );
  }
  return true;
}
export function getModelParameterRange(field: AiModelParameter): {
  min?: number;
  max?: number;
  precision?: number;
  step?: number;
} {
  if (field === 'topP') return { min: 0.1, max: 1, step: 0.1 };
  if (field === 'temperature') return { min: 0, step: 0.1 };
  if (field === 'topK') return { min: 0, precision: 0 };
  if (field.endsWith('Penalty')) return { step: 0.1 };
  return { precision: 0 };
}

// 模型建议来自本地 ui-ngx；仍允许手动输入供应商支持的其他模型 ID。
export const modelSuggestions: Record<AiProvider, string[]> = {
  OPENAI: [
    'o3-pro',
    'o3',
    'gpt-5.5-pro',
    'gpt-5.5',
    'gpt-5.4-pro',
    'gpt-5.4',
    'gpt-5.4-mini',
    'gpt-5.4-nano',
    'gpt-5.2',
    'gpt-5.1',
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4o',
    'gpt-4o-mini',
  ],
  AZURE_OPENAI: [],
  GOOGLE_AI_GEMINI: [
    'gemini-3.5-flash',
    'gemini-3.1-pro-preview',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ],
  GOOGLE_VERTEX_AI_GEMINI: [
    'gemini-3.5-flash',
    'gemini-3.1-pro-preview',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ],
  MISTRAL_AI: [
    'mistral-large-latest',
    'mistral-medium-latest',
    'mistral-small-latest',
    'ministral-14b-latest',
    'ministral-8b-latest',
    'ministral-3b-latest',
  ],
  ANTHROPIC: [
    'claude-opus-4-8',
    'claude-opus-4-7',
    'claude-opus-4-6',
    'claude-opus-4-5',
    'claude-opus-4-1',
    'claude-sonnet-4-6',
    'claude-sonnet-4-5',
    'claude-haiku-4-5',
  ],
  AMAZON_BEDROCK: [],
  GITHUB_MODELS: [],
  OLLAMA: [],
};
