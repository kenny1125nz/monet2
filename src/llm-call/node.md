# LLM Call

## Responsibility

Provides a unified interface for making LLM API calls to configured providers. This capability abstracts over different LLM providers (Anthropic, OpenAI, etc.) and handles API key management, request/response formatting, retry logic, and error handling so that other capabilities can make LLM calls without worrying about provider-specific details.

## Exposes

```typescript
export interface LlmCaller {
  call(request: LlmRequest): Promise<LlmResponse>
  callStreaming(request: LlmRequest): AsyncIterable<LlmStreamChunk>
}

export interface LlmRequest {
  provider: string       // Named provider key from config, e.g. "analyze", "plan", "coding"
  systemPrompt?: string
  messages: LlmMessage[]
  temperature?: number
  maxTokens?: number
}


export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmResponse {
  content: string
  model: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export interface LlmStreamChunk {
  type: 'content' | 'done' | 'error'
  content?: string
  model?: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  error?: string
}

```

## Acceptance Criteria

- Can make an LLM call using a named provider from configuration (e.g. `"analyze"`, `"plan"`, `"coding"`)
- Supports both standard (full response) and streaming (chunked) API calls
- Streaming returns an `AsyncIterable` of typed chunks (`content`, `done`, `error`)
- Supports Anthropic and OpenAI-compatible endpoints
- Returns the response content along with model and token usage metadata
- Handles API errors gracefully with clear error messages
- Supports configurable temperature and max tokens
- Retries on transient failures (rate limits, network errors) with exponential backoff

## Quality Metrics

- All capabilities that need LLM access use this interface rather than calling providers directly
- Provider configuration is read from the shared config system
- Errors are surfaced with enough context to diagnose configuration or API issues
- Retry logic does not mask persistent failures
- Streaming chunks are delivered as soon as they arrive from the provider, with minimal buffering

