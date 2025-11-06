export type ProviderName = "openai" | "vertex" | "anthropic" | "mock";

export interface LLMConfig {
  provider: ProviderName;
  model: string;
  apiKey?: string;
  endpoint?: string;
  projectId?: string; // e.g., for Vertex
}

export interface LLMRequest {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
}

export interface LLMResponse<T = any> {
  text: string;
  raw?: T;
}
