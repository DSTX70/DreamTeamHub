# LLM Provider System

## Overview

The Dream Team Hub includes a pluggable LLM provider system that allows you to use multiple AI model providers (OpenAI, Vertex AI, Anthropic, or custom providers) with a unified interface. This document explains how the system works and how to add new providers.

## Architecture

The provider system consists of three main components:

1. **Provider Interface** (`shared/llm/types.ts`): Defines the contract all providers must implement
2. **Provider Implementations** (`shared/llm/providers.ts`): Concrete implementations for each provider
3. **Provider Factory** (`shared/llm/providers.ts`): Creates provider instances based on configuration

## Provider Interface

All LLM providers must implement the `LLMProvider` interface:

```typescript
export interface LLMProvider {
  infer(request: LLMRequest): Promise<LLMResponse>;
}

export interface LLMRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  text: string;
  provider: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

## Built-in Providers

### 1. OpenAI Provider

**Configuration:**
- Requires: `OPENAI_API_KEY` environment variable
- Supported models: `gpt-4.1-mini`, `gpt-4`, `gpt-3.5-turbo`

**Example:**
```typescript
const provider = makeProvider({
  provider: "openai",
  model: "gpt-4.1-mini"
});

const response = await provider.infer({
  prompt: "What is 2+2?",
  max_tokens: 100,
  temperature: 0.7
});
```

### 2. Vertex AI Provider (Google)

**Configuration:**
- Requires: Google Cloud credentials
- Supported models: `gemini-1.5-pro`, `gemini-1.5-flash`

**Example:**
```typescript
const provider = makeProvider({
  provider: "vertex",
  model: "gemini-1.5-pro"
});
```

### 3. Anthropic Provider

**Configuration:**
- Requires: `ANTHROPIC_API_KEY` environment variable
- Supported models: `claude-3-5-sonnet-20241022`, `claude-3-opus`

**Example:**
```typescript
const provider = makeProvider({
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022"
});
```

### 4. Mock Provider

**Configuration:**
- No configuration required
- Returns: `"Mock response for prompt: <prompt>"`

**Usage:**
- Testing and development
- CI/CD pipelines where real API calls are not needed

**Example:**
```typescript
const provider = makeProvider({
  provider: "mock",
  model: "test-model"
});
```

## Adding a New Provider

### Step 1: Create Provider Class

Create a new class implementing the `LLMProvider` interface in `shared/llm/providers.ts`:

```typescript
export class MyCustomProvider implements LLMProvider {
  constructor(private config: LLMProviderConfig) {}

  async infer(request: LLMRequest): Promise<LLMResponse> {
    // Your implementation here
    const apiResponse = await fetch('https://api.mycustom.com/v1/infer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MYCUSTOM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: request.prompt,
        max_tokens: request.max_tokens,
        temperature: request.temperature
      })
    });

    const data = await apiResponse.json();

    return {
      text: data.output,
      provider: "mycustom",
      model: this.config.model,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens
      }
    };
  }
}
```

### Step 2: Register Provider in Factory

Add your provider to the `makeProvider()` function:

```typescript
export function makeProvider(config: LLMProviderConfig): LLMProvider {
  const providerName = config.provider || "mock";

  switch (providerName) {
    case "openai":
      return new OpenAIProvider(config);
    case "vertex":
      return new VertexProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "mycustom":  // Add your provider here
      return new MyCustomProvider(config);
    case "mock":
      return new MockProvider(config);
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}
```

### Step 3: Update Provider Select UI

Add your provider to the dropdown in `client/src/pages/llm/ProviderSelect.tsx`:

```typescript
const PROVIDERS = [
  { value: "mock", label: "Mock (Testing)" },
  { value: "openai", label: "OpenAI" },
  { value: "vertex", label: "Vertex AI (Google)" },
  { value: "anthropic", label: "Anthropic" },
  { value: "mycustom", label: "My Custom Provider" },  // Add here
];
```

### Step 4: Add Environment Variables

Update `.env` or environment configuration:

```bash
# Add required API keys
MYCUSTOM_API_KEY=your_api_key_here
```

### Step 5: Document Your Provider

Add documentation to this file:

```markdown
### 5. My Custom Provider

**Configuration:**
- Requires: `MYCUSTOM_API_KEY` environment variable
- Supported models: `model-v1`, `model-v2`
- Endpoint: https://api.mycustom.com/v1/infer

**Example:**
\`\`\`typescript
const provider = makeProvider({
  provider: "mycustom",
  model: "model-v1"
});
\`\`\`

**Special Features:**
- Custom feature 1
- Custom feature 2
```

## API Endpoint

The LLM inference API endpoint is available at `POST /api/llm/infer`:

```bash
curl -X POST "http://localhost:5000/api/llm/infer" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "prompt": "What is the capital of France?"
  }'
```

**Response:**
```
Paris
```

## Frontend Usage

Use the Provider Select page at `/llm/provider` to test providers interactively, or integrate the provider system into your components:

```typescript
import { apiRequest } from "@/lib/queryClient";

async function runInference(prompt: string) {
  const response = await apiRequest({
    method: "POST",
    url: "/api/llm/infer",
    data: {
      provider: "openai",
      model: "gpt-4.1-mini",
      prompt
    }
  });
  
  return response.text();
}
```

## Error Handling

All providers should handle errors gracefully:

```typescript
async infer(request: LLMRequest): Promise<LLMResponse> {
  try {
    // API call logic
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Invalid API key for MyCustom provider");
    }
    if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded for MyCustom provider");
    }
    throw new Error(`MyCustom provider error: ${error.message}`);
  }
}
```

## Best Practices

### 1. Configuration Validation

Validate configuration before making API calls:

```typescript
constructor(private config: LLMProviderConfig) {
  if (!process.env.MYCUSTOM_API_KEY) {
    throw new Error("MYCUSTOM_API_KEY environment variable is required");
  }
  
  const validModels = ["model-v1", "model-v2"];
  if (!validModels.includes(config.model)) {
    throw new Error(`Invalid model: ${config.model}. Must be one of: ${validModels.join(", ")}`);
  }
}
```

### 2. Token Usage Tracking

Always return token usage information for cost tracking:

```typescript
return {
  text: response.text,
  provider: "mycustom",
  model: this.config.model,
  usage: {
    prompt_tokens: response.usage.input,
    completion_tokens: response.usage.output,
    total_tokens: response.usage.input + response.usage.output
  }
};
```

### 3. Timeout Handling

Implement reasonable timeouts to prevent hanging requests:

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

try {
  const response = await fetch(url, {
    signal: controller.signal,
    ...options
  });
  return await response.json();
} finally {
  clearTimeout(timeout);
}
```

### 4. Retry Logic

Implement exponential backoff for transient failures:

```typescript
async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Testing

### Unit Tests

Test your provider implementation:

```typescript
describe("MyCustomProvider", () => {
  it("should return valid response", async () => {
    const provider = makeProvider({
      provider: "mycustom",
      model: "model-v1"
    });

    const response = await provider.infer({
      prompt: "Hello, world!"
    });

    expect(response.text).toBeDefined();
    expect(response.provider).toBe("mycustom");
    expect(response.usage).toBeDefined();
  });

  it("should handle errors gracefully", async () => {
    const provider = makeProvider({
      provider: "mycustom",
      model: "invalid-model"
    });

    await expect(
      provider.infer({ prompt: "test" })
    ).rejects.toThrow();
  });
});
```

### Integration Tests

Use the regression test script:

```bash
# Test new provider via API
curl -X POST "http://localhost:5000/api/llm/infer" \
  -H "Authorization: Bearer ${DTH_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "mycustom",
    "model": "model-v1",
    "prompt": "Test prompt"
  }'
```

## Deployment Checklist

Before deploying a new provider:

- [ ] Provider class implements `LLMProvider` interface
- [ ] Factory function includes new provider
- [ ] UI dropdown updated with new provider option
- [ ] Environment variables documented
- [ ] Error handling implemented
- [ ] Token usage tracking included
- [ ] Documentation added to this file
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] API keys configured in production environment

## Troubleshooting

### Provider Not Found

**Error:** `Unknown provider: mycustom`

**Solution:** Ensure provider is registered in `makeProvider()` function

### API Key Missing

**Error:** `MYCUSTOM_API_KEY environment variable is required`

**Solution:** Add API key to `.env` file or environment configuration

### Invalid Model

**Error:** `Invalid model: invalid-model`

**Solution:** Check supported models list for your provider

### Rate Limit Exceeded

**Error:** `Rate limit exceeded for MyCustom provider`

**Solution:** Implement retry logic with exponential backoff or reduce request frequency

## Support

For questions or issues with the LLM provider system:

1. Check this documentation
2. Review existing provider implementations in `shared/llm/providers.ts`
3. Check API regression tests in `tests/api-regression.sh`
4. Review the LLM provider interface in `shared/llm/types.ts`

## Future Enhancements

Planned improvements to the provider system:

- [ ] Streaming support for real-time responses
- [ ] Caching layer for repeated prompts
- [ ] Cost tracking and budgeting
- [ ] Provider health monitoring
- [ ] A/B testing between providers
- [ ] Automatic fallback to backup providers
- [ ] Request/response logging for debugging
