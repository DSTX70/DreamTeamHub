import { LLMConfig, LLMRequest, LLMResponse } from "./types";
import OpenAI from "openai";

export interface Provider {
  infer(req: LLMRequest): Promise<LLMResponse>;
}

class OpenAIProvider implements Provider {
  private client: OpenAI;
  private model: string;

  constructor(cfg: LLMConfig) {
    const apiKey = cfg.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config.");
    }
    
    this.client = new OpenAI({ apiKey });
    this.model = cfg.model || "gpt-4o-mini";
  }

  async infer(req: LLMRequest): Promise<LLMResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: req.prompt
          }
        ],
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens ?? 1000,
      });

      const text = completion.choices[0]?.message?.content || "";
      
      return {
        text,
        raw: {
          usage: completion.usage,
          model: completion.model,
          finish_reason: completion.choices[0]?.finish_reason
        }
      };
    } catch (error: any) {
      if (error?.status === 401) {
        throw new Error("Invalid OpenAI API key");
      }
      if (error?.status === 429) {
        throw new Error("OpenAI rate limit exceeded. Please try again later.");
      }
      if (error?.status === 500 || error?.status === 503) {
        throw new Error("OpenAI service is temporarily unavailable");
      }
      throw new Error(`OpenAI API error: ${error?.message || "Unknown error"}`);
    }
  }
}

class VertexProvider implements Provider {
  private projectId: string;
  private model: string;
  private endpoint?: string;

  constructor(cfg: LLMConfig) {
    if (!cfg.projectId) {
      throw new Error("Vertex AI requires projectId in config");
    }
    this.projectId = cfg.projectId;
    this.model = cfg.model || "gemini-1.5-pro";
    this.endpoint = cfg.endpoint;
  }

  async infer(req: LLMRequest): Promise<LLMResponse> {
    // Using Google's Generative AI SDK for Vertex AI
    try {
      const endpoint = this.endpoint || `https://${this.projectId}.googleapis.com/v1/models/${this.model}:generateContent`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // In production, you'd need proper Google Cloud authentication
          // For now, we'll return a helpful error message
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: req.prompt
            }]
          }],
          generationConfig: {
            temperature: req.temperature ?? 0.7,
            maxOutputTokens: req.max_tokens ?? 1000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Vertex AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return {
        text,
        raw: data
      };
    } catch (error: any) {
      throw new Error(`Vertex AI error: ${error.message}. Note: Vertex AI requires Google Cloud credentials to be configured.`);
    }
  }
}

class AnthropicProvider implements Provider {
  private apiKey: string;
  private model: string;

  constructor(cfg: LLMConfig) {
    const apiKey = cfg.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or pass apiKey in config.");
    }
    
    this.apiKey = apiKey;
    this.model = cfg.model || "claude-3-5-sonnet-20241022";
  }

  async infer(req: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: req.max_tokens ?? 1000,
          temperature: req.temperature ?? 0.7,
          messages: [{
            role: 'user',
            content: req.prompt
          }]
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error("Invalid Anthropic API key");
        }
        if (response.status === 429) {
          throw new Error("Anthropic rate limit exceeded. Please try again later.");
        }
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";

      return {
        text,
        raw: {
          usage: data.usage,
          model: data.model,
          stop_reason: data.stop_reason
        }
      };
    } catch (error: any) {
      if (error.message.includes("API key") || error.message.includes("rate limit")) {
        throw error;
      }
      throw new Error(`Anthropic API error: ${error?.message || "Unknown error"}`);
    }
  }
}

class MockProvider implements Provider {
  async infer(req: LLMRequest): Promise<LLMResponse> {
    return { 
      text: `MOCK: ${req.prompt}`,
      raw: {
        mock: true,
        prompt_length: req.prompt.length
      }
    };
  }
}

export function makeProvider(cfg: LLMConfig): Provider {
  switch (cfg.provider) {
    case "mock":
      return new MockProvider();
    case "openai":
      return new OpenAIProvider(cfg);
    case "vertex":
      return new VertexProvider(cfg);
    case "anthropic":
      return new AnthropicProvider(cfg);
    default:
      throw new Error(`Unknown provider: ${cfg.provider}`);
  }
}
