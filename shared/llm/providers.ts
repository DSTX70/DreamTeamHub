import { LLMConfig, LLMRequest, LLMResponse } from "./types";

export interface Provider {
  infer(req: LLMRequest): Promise<LLMResponse>;
}

export function makeProvider(cfg: LLMConfig): Provider {
  switch (cfg.provider) {
    case "mock":
      return {
        async infer(req) {
          return { text: `MOCK: ${req.prompt}` };
        },
      };
    case "openai":
      // Wire your SDK here. Keeping it stubbed to avoid runtime deps.
      return {
        async infer(req) {
          // TODO: call OpenAI SDK with cfg.apiKey/cfg.model
          return { text: `[openai:${cfg.model}] ${req.prompt}` };
        },
      };
    case "vertex":
      return {
        async infer(req) {
          // TODO: Vertex call using cfg.projectId/cfg.endpoint
          return { text: `[vertex:${cfg.model}] ${req.prompt}` };
        },
      };
    case "anthropic":
      return {
        async infer(req) {
          // TODO: Anthropic call
          return { text: `[anthropic:${cfg.model}] ${req.prompt}` };
        },
      };
    default:
      throw new Error("Unknown provider");
  }
}
