# Project Monet: Architecture & Design Decisions (MVP)

## 1. Core Philosophy

### The Directory-as-Architecture Principle
The directory tree is a **representation** of the architecture, not the architecture itself. Node Units capture ownership and decomposition. A separate behaviour reference graph captures runtime dependencies. These are two distinct concerns.

### The One-Layer-Only Principle
Every view — diagrams, reports, UI navigation — shows exactly **one level of the hierarchy** at a time. You navigate into a node to see its children. The whole tree is never rendered at once. This is the universal philosophy of the app, applied wherever applicable.

### The Governor of Constraints
The role of the Software Engineer shifts from "Writer of Logic" to "Governor of Constraints." Monet concentrates human effort into high-value design decisions while AI handles bounded implementation tasks.

---

## 2. Node Unit Contract

Every directory in the workspace is a Node Unit. Its contract lives in a `node.md` file — a templated markdown file using heading levels as structure, TypeScript code blocks for schemas, and JSON code blocks for diagrams.

### Contract Sections (MVP)

| Section                  | Authored by                | Phase  |
| ------------------------ | -------------------------- | ------ |
| `## Responsibility`      | Human / AI proposal        | Design |
| `## Exposes`             | Human / AI proposal        | Design |
| `## Acceptance Criteria` | Human / AI proposal        | Design |
| `## Quality Metrics`     | Human / AI proposal        | Design |
| `## Design`              | AI proposal, human reviews | Design |
| `## Findings`            | Human / review tooling     | Review |
| `## Ehancements`         | Human / review tooling     | Review |


### The `## Interface` Section
Declares the public surface this node exposes to other nodes. Always written in **TypeScript**, regardless of the target project's implementation language. The coding agent translates this into the target language.

```typescript
// Example ## Interface block
export interface AuthService {
  validate(token: string): Promise<AuthResult>
  revoke(tokenId: string): Promise<void>
}
```

### The `## Flow` Section
A JSON code block conforming to the shared `FlowGraph` data model. Documents how this node's immediate children interact (data flow). Authored by the design AI, reviewed by human. Covers **one layer only** — the immediate children of this node.

This is the **authoritative source of dependency relationships**. A directed edge from node A to node B in the parent's `## Flow` is what gives A a dependency on B — nodes do not declare their own imports. The build system derives each node's dependency context by reading the edges in its parent's flow graph that point to it.

```json
{
  "nodes": [...],
  "edges": [...]
}
```

### External Reference Nodes
Dependencies on things outside the project tree (third-party libraries, databases, platform APIs, other services) are represented as **external reference nodes** — directories in the tree that contain a `node.md` with only a `## Responsibility` and `## Interface` section and an `external: true` frontmatter flag. No implementation is generated for them.

External reference nodes participate in the `## Flow` graph of their parent just like any other node. The build system recognises the `external: true` flag and skips agent dispatch for those nodes, but still provides their `## Interface` to any dependents as context.

```yaml
---
external: true
---
```

This keeps the dependency model uniform: everything a node depends on — sibling, child, or external — is expressed as an edge in the parent's flow graph pointing to a node with an `## Interface`.

---

## 3. The Facade Pattern

Every Node Unit has a `facade.ts` (or target-language equivalent) as its **sole legal import surface**. Other nodes may only import from the Facade — never from internal implementation files.

- Language-level visibility (`export`, `public`) is insufficient — the Facade is the architectural guarantee
- The Facade mirrors the `## Interface` declared in `node.md`
- When the coding agent discovers the declared interface is incomplete, it appends proposals to `## Interface Proposals` in `node.md` and continues building optimistically against its proposed interface
- Unresolved `## Interface Proposals` are **blocking items** in review

---

## 4. Cross-Cutting Concerns

### Conceptual Cross-Cutting (e.g. error handling patterns, auth conventions)
Translated into **design/implementation principles** passed as context to the coding agent. Not enforced structurally — enforced through agent prompting.

### Physical Cross-Cutting (shared libs/utils)
Governed by the sibling/pass-down visibility rules. No global escape hatch — even universal utilities follow the same governance.

### Interface Definitions
Always TypeScript, regardless of target project language. The coding agent handles translation to the target language. TypeScript serves as the universal contract language (analogous to Protobuf/OpenAPI).

---

## 5. Commands (MVP)

### `monet init`
Bootstraps a new project. Creates root `node.md` in the current directory. Configuration lives globally at install time (`~/.monet/config`) — not per project. Greenfield only for the initial version; brownfield analysis is a future feature.

### `monet design`
A continuous CLI loop — like Claude Code — where the human prompts and the AI proposes decompositions by writing/updating `node.md` files via tool use. The loop runs until the human explicitly exits.

`monet design` can be run from **any directory** in the project tree. The directory from which it is launched is considered the **current designing node** — all design operations (reading, writing, validating) are scoped to that node and its children.

The design AI has a scoped toolset: `read_node`, `write_node`, `list_tree`, `run_validate`. It cannot access implementation files or run build commands.

#### In-loop commands
The loop input accepts either a natural language prompt (forwarded to the AI) or a recognised command keyword (executed directly). Commands and prompts share the same input — no special prefix required.

Navigation commands (operate on the **design scope**, not the shell's working directory):
- `cd ..` — moves scope up to the parent node
- `cd <relative-path>` — moves scope to a child or sibling node
- `cd <absolute-path>` — moves scope to any node in the project

The prompt always displays the current node path so the user knows where they are in the tree.

Control commands:
- `decompose` — triggers the AI to analyse the current node's `## Responsibility` and propose a child node breakdown: creates or updates child `node.md` files with draft `## Responsibility` and `## Interface` sections, and writes a draft `## Flow` block into the current node capturing the proposed data flow between children. The human reviews and refines the proposals before proceeding.
- `apply` — reads the `## Flow` block of the current node and materialises it into the filesystem: creates a directory for each node listed in the flow graph that does not already exist, and seeds it with a minimal `node.md` carrying the node's `id`, `label`, and `responsibility` from the flow entry. Existing directories and `node.md` files are left untouched. Idempotent — safe to re-run after editing the flow.
- `validate` — runs structural validation: every edge in every `## Flow` graph resolves to an existing child node or external reference node; every node referenced as a dependency has an `## Interface` section; no circular dependencies across the full flow graph.
- `exit` / `quit` — exits the loop.

#### One-shot CLI invocation
The same control commands are also available as CLI subcommands for scripting and CI use, bypassing the interactive loop entirely:
- `monet design decompose`
- `monet design apply`
- `monet design validate`

### `monet build`
Reads the behaviour reference graph, computes topological wave order mathematically (Kahn's algorithm on the DAG), and dispatches coding agents to nodes wave by wave. Nodes within the same wave have no dependencies on each other and are dispatched in parallel.

The build order is deterministic and provably deadlock-free because validation guarantees no cycles exist.

Each coding agent receives exactly:
1. Its own full `node.md`
2. The `## Interface` section from each node it depends on (derived from its parent's `## Flow` edges)
3. The `facade.ts` of each completed dependency (prior waves)
4. Global design principles (conceptual cross-cutting concerns)

Nothing else. No sibling code, no parent implementation, no full tree.

The coding agent produces a **node bundle**:
- Implementation files
- `facade.ts`
- Unit tests
- `implementation_report.md`

### `monet analyze`
Runs the AST-based drift analyzer on the implemented code. Extracts the actual design from the code and compares it against the intended design (from `## Interface` and `## Flow` in `node.md`). Outputs a structured drift report for human review.

This is the core feedback loop — making divergence between intention and implementation visible and measurable.

### `monet review`
Consolidates all node bundle outputs and renders a structured review. Review is primarily a **human activity** — the tool provides structured evidence, the human makes judgements.

The review contains per node:
- Component dependency diagram (rendered from AST analysis)
- Test report (from `implementation_report.md`)
- Facade vs declared interface comparison
- Undeclared dependency flags
- Unresolved `## Interface Proposals`

Two possible human outcomes after review:
1. **Findings** → append `## Findings` to affected `node.md` files → run `monet build` (short loop)
2. **Changes** → update `## Interface` or `## Flow` in affected `node.md` files → run `monet design` (long loop)

---

## 6. The PDCA Loop (MVP)

```
monet design  →  monet build  →  monet analyze  →  monet review
     ↑                                                        |
     |____________________ Changes (long loop) ________________|
          ↑                                                   |
          |_______________ Findings (short loop) _____________|
```

---

## 7. The Flow Data Model

Shared between design-time flow diagrams and review-time component diagrams. Both views render from the same graph renderer using this schema.

```typescript
interface FlowGraph {
  nodes: DiagramNode[]
  edges: FlowEdge[] | ComponentEdge[]
}

interface DiagramNode {
  id: string              // node path e.g. "/api/auth"
  label: string
  responsibility: string
  status?: 'pending' | 'in_progress' | 'done' | 'blocked'
}

interface BaseEdge {
  from: string
  to: string
  label?: string
  interface?: string      // TypeScript interface definition — on every edge
}

// Design-time: data flowing between nodes (from node.md JSON block)
interface FlowEdge extends BaseEdge {
  dataShape?: string
}

// Review-time: actual dependencies (from AST analysis)
interface ComponentEdge extends BaseEdge {
  dependencyType?: 'runtime' | 'compile'
}
```

The `interface` field on `BaseEdge` is the key shared property — clicking any edge in either diagram surfaces the TypeScript interface definition for that interaction.

---

## 8. Technology Stack (MVP)

### Monet CLI & Core
- **Runtime:** TypeScript / Node.js
- **CLI framework:** TBD (Commander or Oclif)

### Design Phase AI
- **SDK:** Vercel AI SDK (`ai` package) — unified interface for OpenAI and Anthropic
- **Model:** Strong model, user-configured (e.g. Claude Sonnet/Opus or GPT-4o)
- **Interaction:** Continuous CLI loop with scoped tool use (`read_node`, `write_node`, `list_tree`, `run_validate`)

### Build Phase Agents
- **Integration model:** Plugin/adapter pattern
- **Abstract interface:**
```typescript
interface MonetAgentAdapter {
  execute(task: NodeTask): Promise<TaskResult>
}

interface NodeTask {
  node: NodeContract
  contextBundle: Bundle    // own contract + import interfaces + facades
  workingDir: string       // scoped to this node's directory
}

interface TaskResult {
  status: 'done' | 'blocked'
  proposedInterfaceChanges?: InterfaceProposal[]
  findings?: string
}
```
- **Reference implementation:** [Aider](https://aider.chat) — CLI-native, BYO API key, OpenAI-compatible endpoints, supports Ollama for self-hosted
- **Community:** Additional adapters left to open source

### AST Drift Analyzer
- **Parser:** TypeScript compiler API (`ts.createSourceFile`) for TS/TSX projects
- **Output:** Structured drift report comparing intended vs actual interfaces and dependencies

---

## 9. Bootstrap Strategy

Monet itself is designed and built following its own philosophy and process. This is both a validation of the approach and a forcing function for the MVP.

**Bootstrap sequence:**
1. Hand-build the MVP of `monet design` — the continuous CLI loop, file writing via tool use, structural validation
2. Use `monet design` to design Monet's remaining components as Node Units
3. Use `monet build` (once built) to implement those components — the first real test of the executor is building itself

**Priority order:** The design phase must ship first. It is the prerequisite for everything else and the core value of the product.
