import { Node, DataFlowDesign } from '../data-model/node.js'
import { llmCaller, LlmMessage } from '../llm-call/index.js'
import { log } from '../utils/index.js'

export interface Designer {
  design(node: Node): Promise<Node>
  proposeDecomposition(node: Node, write: (chunk: string) => void): Promise<Node>
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are a software architect helping to decompose software components recursively.

A node is a self-contained component. It has:
- name: kebab-case directory identifier
- responsibility: one sentence — what this component exists to do
- exposes: TypeScript interface — the public surface it offers to other components

A decomposition breaks a node into immediate child nodes and defines how they exchange data.
The result is expressed as a DataFlowDesign:

interface DataFlowDesign {
  participants: string[]   // kebab-case child node names
  dataFlows: DataFlow[]
}

interface DataFlow {
  producer: string         // child node that provides / returns data
  consumer: string         // child node that calls / requests data
  contract: string         // TypeScript interface for this interaction (required)
  label?: string           // one-line description of the interaction
  dataShape?: string       // description of the payload
}

Rules:
- Cover exactly one layer — only immediate children, not grandchildren
- Decompose along vertical slices (each child owns its full stack), not horizontal layers
- Every DataFlow.contract must be valid TypeScript
- Participant names must be valid directory names (kebab-case, no spaces)
- Keep each child's responsibility to one sentence

Respond in this exact structure:

## Child Nodes

### <name>
Responsibility: <one sentence>
\`\`\`typescript
<TypeScript interface>
\`\`\`

(repeat for each child)

## Data Flow Design
\`\`\`json
{
  "participants": [...],
  "dataFlows": [...]
}
\`\`\`
`

function buildUserPrompt(node: Node): string {
  const lines: string[] = [
    `Decompose the following node into child nodes and define the data flow between them.`,
    ``,
    `## Node: ${node.name}`,
    ``,
    `### Responsibility`,
    node.responsibility || '(not defined)',
    ``,
  ]

  if (node.exposes) {
    lines.push(`### Exposes`)
    lines.push('```typescript')
    lines.push(node.exposes)
    lines.push('```')
    lines.push('')
  }

  if (node.acceptanceCriteria) {
    lines.push(`### Acceptance Criteria`)
    lines.push(node.acceptanceCriteria)
    lines.push('')
  }

  return lines.join('\n')
}

// ── Response parsing ──────────────────────────────────────────────────────────

function extractDataFlowDesign(response: string): DataFlowDesign | undefined {
  const match = response.match(/```json\s*([\s\S]*?)\s*```/)
  if (!match) {
    log.debug('extractDataFlowDesign: no json block found in response')
    return undefined
  }
  try {
    const parsed = JSON.parse(match[1]) as DataFlowDesign
    log.debug('extractDataFlowDesign: parsed', {
      participants: parsed.participants?.length,
      flows: parsed.dataFlows?.length,
    })
    return parsed
  } catch (err) {
    log.error('extractDataFlowDesign: failed to parse json block', { err: String(err) })
    return undefined
  }
}

// ── Implementation ────────────────────────────────────────────────────────────

async function proposeDecomposition(
  node: Node,
  write: (chunk: string) => void
): Promise<Node> {
  log.debug('proposeDecomposition', { node: node.name })

  const messages: LlmMessage[] = [{ role: 'user', content: buildUserPrompt(node) }]

  let fullResponse = ''

  for await (const chunk of llmCaller.callStreaming({
    provider: 'design',
    systemPrompt: SYSTEM_PROMPT,
    messages,
  })) {
    if (chunk.type === 'content' && chunk.content) {
      write(chunk.content)
      fullResponse += chunk.content
    } else if (chunk.type === 'done') {
      log.debug('proposeDecomposition: stream done', { model: chunk.model, usage: chunk.usage })
    } else if (chunk.type === 'error') {
      log.error('proposeDecomposition: stream error', { error: chunk.error })
      throw new Error(chunk.error ?? 'Unknown error from LLM')
    }
  }

  const design = extractDataFlowDesign(fullResponse)
  return { ...node, design }
}

export const designer: Designer = {
  proposeDecomposition,

  async design(node: Node): Promise<Node> {
    let fullResponse = ''
    return proposeDecomposition(node, (chunk) => { fullResponse += chunk })
  },
}
