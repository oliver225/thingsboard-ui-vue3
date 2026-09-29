/**
 * AI 供应商(对应后端 org.thingsboard.server.common.data.ai.provider.AiProvider)
 */
export enum AiProvider {
  AMAZON_BEDROCK = 'AMAZON_BEDROCK',
  ANTHROPIC = 'ANTHROPIC',
  AZURE_OPENAI = 'AZURE_OPENAI',
  GITHUB_MODELS = 'GITHUB_MODELS',
  GOOGLE_AI_GEMINI = 'GOOGLE_AI_GEMINI',
  GOOGLE_VERTEX_AI_GEMINI = 'GOOGLE_VERTEX_AI_GEMINI',
  MISTRAL_AI = 'MISTRAL_AI',
  OLLAMA = 'OLLAMA',
  OPENAI = 'OPENAI',
}

/** 供应商展示名(品牌名,不翻译) */
const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  [AiProvider.AMAZON_BEDROCK]: 'Amazon Bedrock',
  [AiProvider.ANTHROPIC]: 'Anthropic',
  [AiProvider.AZURE_OPENAI]: 'Azure OpenAI',
  [AiProvider.GITHUB_MODELS]: 'GitHub Models',
  [AiProvider.GOOGLE_AI_GEMINI]: 'Google AI Gemini',
  [AiProvider.GOOGLE_VERTEX_AI_GEMINI]: 'Google Vertex AI Gemini',
  [AiProvider.MISTRAL_AI]: 'Mistral AI',
  [AiProvider.OLLAMA]: 'Ollama',
  [AiProvider.OPENAI]: 'OpenAI',
};

/** AI 供应商 → 展示名 */
export function aiProviderLabel(value?: AiProvider | string): string {
  if (!value) return '';
  return AI_PROVIDER_LABELS[value as AiProvider] ?? value;
}
