import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export interface LlmRequest {
  provider: string
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

export interface LlmCaller {
  call(request: LlmRequest): Promise<LlmResponse>
  callStreaming(request: LlmRequest): AsyncIterable<LlmStreamChunk>
}

// ── Config ────────────────────────────────────────────────────────────────────

interface ProviderConfig {
  apiKey: string
  model: string
  endpoint: string
}

interface MonetConfig {
  llmProviders?: Record<string, ProviderConfig>
}

function readJsonFile(filePath: string): MonetConfig {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MonetConfig
  } catch {
    return {}
  }
}

function loadConfig(): MonetConfig {
  const global = readJsonFile(path.join(os.homedir(), '.monet', 'config'))
  const local = readJsonFile(path.join(process.cwd(), '.monet', 'config'))
  return {
    llmProviders: { ...global.llmProviders, ...local.llmProviders },
  }
}

function resolveProvider(providerName: string): ProviderConfig {
  const config = loadConfig()
  const provider = config.llmProviders?.[providerName]
  if (!provider) {
    throw new Error(
      `LLM provider "${providerName}" not found in config. ` +
        `Add it to ~/.monet/config under "llmProviders".`
    )
  }
  if (!provider.apiKey || !provider.model || !provider.endpoint) {
    throw new Error(
      `LLM provider "${providerName}" is missing required fields: apiKey, model, endpoint.`
    )
  }
  return provider
}

// ── HTTP ──────────────────────────────────────────────────────────────────────

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postWithRetry(
  provider: ProviderConfig,
  body: Record<string, unknown>,
  attempt = 0
): Promise<Response> {
  const url = `${provider.endpoint.replace(/\/$/, '')}/chat/completions`
  let response: Response

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({ model: provider.model, ...body }),
    })
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY_MS * 2 ** attempt)
      return postWithRetry(provider, body, attempt + 1)
    }
    throw new Error(`Network error after ${MAX_RETRIES} retries: ${String(err)}`)
  }

  if (!response.ok) {
    if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_RETRIES) {
      const retryAfter = response.headers.get('retry-after')
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : BASE_DELAY_MS * 2 ** attempt
      await sleep(delay)
      return postWithRetry(provider, body, attempt + 1)
    }
    const text = await response.text()
    throw new Error(`LLM request failed (${response.status}): ${text}`)
  }

  return response
}

// ── Wire format (OpenAI-compatible) ───────────────────────────────────────────

interface WireMessage {
  role: string
  content: string
}

interface WireResponse {
  model: string
  choices: Array<{ message: { content: string } }>
  usage?: { prompt_tokens: number; completion_tokens: number }
}

interface WireStreamChunk {
  model?: string
  choices: Array<{ delta?: { content?: string } }>
  usage?: { prompt_tokens: number; completion_tokens: number }
}

function buildMessages(request: LlmRequest): WireMessage[] {
  const messages: WireMessage[] = []
  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt })
  }
  messages.push(...request.messages)
  return messages
}

function buildBody(request: LlmRequest, extra?: Record<string, unknown>): Record<string, unknown> {
  const body: Record<string, unknown> = { messages: buildMessages(request) }
  if (request.temperature !== undefined) body.temperature = request.temperature
  if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens
  return { ...body, ...extra }
}

// ── Implementation ────────────────────────────────────────────────────────────

export const llmCaller: LlmCaller = {
  async call(request) {
    const provider = resolveProvider(request.provider)
    const response = await postWithRetry(provider, buildBody(request))
    const data = (await response.json()) as WireResponse

    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
        ? { inputTokens: data.usage.prompt_tokens, outputTokens: data.usage.completion_tokens }
        : undefined,
    }
  },

  async *callStreaming(request) {
    const provider = resolveProvider(request.provider)

    let response: Response
    try {
      response = await postWithRetry(provider, buildBody(request, { stream: true, stream_options: { include_usage: true } }))
    } catch (err) {
      yield { type: 'error', error: String(err) }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', error: 'No response body from provider' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let finalModel: string | undefined

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          let chunk: WireStreamChunk
          try {
            chunk = JSON.parse(data) as WireStreamChunk
          } catch {
            continue
          }

          if (chunk.model) finalModel = chunk.model
          const content = chunk.choices[0]?.delta?.content
          if (content) yield { type: 'content', content }

          if (chunk.usage) {
            yield {
              type: 'done',
              model: finalModel,
              usage: {
                inputTokens: chunk.usage.prompt_tokens,
                outputTokens: chunk.usage.completion_tokens,
              },
            }
          }
        }
      }
    } catch (err) {
      yield { type: 'error', error: String(err) }
    }
  },
}
