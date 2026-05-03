# Essential Capabilities

The irreducible capabilities Monet must provide for one complete cycle to work. These are what the system can DO — not how it's decomposed or implemented.

---

## 0. Data Model of Component and Design

The system has a structured data model that defines what a component is and what a design is.

**What it does:**
- A **component** has: a name, a responsibility statement, a public interface (functions/types it exposes), and dependencies on other components
- A **design** is: a decomposition of a component into sub-components, plus the data flow between them
- Components can be marked as external (third-party, platform, database) — they have an interface but no implementation is generated
- The data model is stored as files in the project tree, one file per component

---

## 0.5. Markdown-Based Node Definition Parsing

The system can read and parse `node.md` files — the templated markdown documents that serve as each component's contract — and extract structured data from them.

**What it does:**
- Parses YAML frontmatter (e.g., `external: true`) from the top of a `node.md` file
- Extracts the `## Responsibility` section as a plain-text statement of the component's purpose
- Extracts the `## Exposes` section, parsing TypeScript code blocks to produce a structured interface definition (exported types, functions, interfaces with their signatures)
- Extracts the `## Design` section, parsing JSON code blocks to produce a structured design model (sub-components and data flow between them)
- Extracts the `## Acceptance Criteria` section as a list of criteria
- Extracts the `## Quality Metrics` section as a list of metrics
- Extracts the `## Findings` section as a list of recorded findings
- Extracts the `## Enhancements` section as a list of proposed enhancements
- Extracts interface proposals from TypeScript code blocks in the `## Exposes` section (lines prefixed with `// Proposed additions:` or `// Proposed changes:`)
- Handles missing or malformed sections gracefully — returns partial results with clear error indicators rather than failing entirely
- Supports both reading a single `node.md` file and scanning a directory tree to discover all component definitions

**Why it's essential:** Every capability in the system — design, scaffolding, analysis, drift detection, review — depends on reading component definitions from `node.md` files. Without this parsing capability, none of the other capabilities can operate.

---

## 1. Design / Decompose with AI and Human Together

The user and an AI collaboratively decompose a component into sub-components.

**What it does:**
- Given a component's responsibility, the AI proposes a set of child components
- For each child, the AI proposes its responsibility and public interface
- The AI proposes how the children interact (data flow between them)
- The human reviews, refines, and approves the proposed decomposition
- The approved decomposition is materialized into the project structure (directories + component files)

---

## 2. Scaffolding

The system generates code from an approved design, following a defined structure and folder pattern.

**What it does:**
- Takes a component's design (responsibility, interface, dependencies)
- Generates implementation files that fulfill the declared interface
- Generates a facade file as the component's sole public surface — other components may only import from the facade
- Generates unit tests
- Produces an implementation report
- Follows a consistent folder pattern: each component lives in its own directory, with its facade at the top level and implementation in subdirectories
- When multiple components exist, implements them in dependency order (dependencies first, then dependents)

---

## 3. AST Analyze and Design Extraction

The system inspects generated code and extracts its actual design.

**What it does:**
- Parses the implemented source files into an AST
- Extracts what the code actually exports (functions, types, classes, their signatures)
- Extracts what the code actually imports (its real dependencies on other components or external libraries)

---

## 4. Design × Drift Presentation

The system compares the intended design against the extracted actual design and presents the differences.

**What it does:**
- Compares actual exports against the declared interface — flags mismatches, missing items, extra items
- Compares actual imports against the declared dependencies — flags undeclared dependencies
- Produces a structured drift report showing all differences
- Presents the drift report alongside test results and facade compliance for human review
- The human can record findings (minor issues) or design changes (major issues requiring a new design cycle)

---

## 5. CLI Interactions

All capabilities are accessible through a command-line interface.

**What it does:**
- `monet init` — bootstrap a new project with the root component and configuration
- `monet design` — enter an interactive CLI loop for AI-assisted decomposition (with navigation commands like `cd`, and control commands like `decompose`, `apply`, `validate`)
- `monet build` — scaffold implementation from the approved design
- `monet analyze` — run AST analysis and drift detection on implemented code
- `monet review` — present drift results for human review
- One-shot variants of design commands for scripting/CI: `monet design decompose`, `monet design apply`, `monet design validate`

---

## 6. LLM API Call

The system can make LLM API calls to configured providers through a unified interface.

**What it does:**
- Provides a single `LlmCaller` interface that all capabilities use to make LLM calls
- Supports both standard (full response) and streaming (chunked via `AsyncIterable`) API calls
- Abstracts over different LLM providers (Anthropic, OpenAI-compatible endpoints)
- Reads provider configuration (API key, model, endpoint) from the shared config system, keyed by capability name (e.g. `analyze`, `plan`, `coding`)
- Handles request/response formatting, retry logic with exponential backoff, and error handling
- Returns response content along with model and token usage metadata

