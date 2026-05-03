# Markdown-Based Schema: The `node.md` Contract

Every component in Monet is defined by a `node.md` file — a templated markdown document that serves as the component's contract. The file uses heading levels as structure, TypeScript code blocks for interface definitions, and JSON code blocks for the design model.

---

## File Location

Each component lives in its own directory. The contract file is always named `node.md` and sits at the root of that directory.

Components are sliced **vertically** — each leaf component is self-contained and owns its full stack (API handlers, business logic, data access). A leaf component is not split by tech layer; instead, the tech layers live inside the component.

```
my-project/
├── node.md                        ← root component
├── payments/
│   ├── node.md                    ← payments component
│   ├── api/                       ← HTTP handlers (internal)
│   ├── logic/                     ← business logic (internal)
│   └── db/                        ← data access (internal)
├── notifications/
│   ├── node.md                    ← notifications component
│   ├── api/                       ← HTTP handlers (internal)
│   ├── logic/                     ← business logic (internal)
│   └── db/                        ← data access (internal)
└── stripe/
    └── node.md                    ← external: Stripe API (external reference)
```

---

## Contract Sections

| Section                  | Authored by                | Phase  |
| ------------------------ | -------------------------- | ------ |
| `## Responsibility`      | Human / AI proposal        | Design |
| `## Exposes`             | Human / AI proposal        | Design |
| `## Acceptance Criteria` | Human / AI proposal        | Design |
| `## Quality Metrics`     | Human / AI proposal        | Design |
| `## Design`              | AI proposal, human reviews | Design |
| `## Findings`            | Human / review tooling     | Review |
| `## Ehancements`         | Human / review tooling     | Review |

---

## `## Responsibility`

A plain-text statement of what this component is responsible for. Written by the human or proposed by the AI during decomposition.

```markdown
## Responsibility

Manages user authentication: validating credentials, issuing tokens, and revoking sessions.
```

---

## `## Design`

TBD — the structured JSON model for the design (decomposition into sub-components and data flow between them) is yet to be defined.

---

## `## Exposes`

Declares the public surface this component exposes to other components. Always written in **TypeScript**, regardless of the target project's implementation language. The coding agent translates this into the target language.

When the coding agent discovers the declared interface is incomplete, it appends proposals as comments within the same TypeScript block. Unresolved proposals are blocking items in review.

```markdown
## Exposes

\`\`\`typescript
export interface AuthService {
  validate(token: string): Promise<AuthResult>
  revoke(tokenId: string): Promise<void>
}

export interface AuthResult {
  userId: string
  roles: string[]
  expiresAt: number
}

// Proposed additions:
// refreshToken(token: string): Promise<AuthResult>  — needed for token refresh flow
// logout(userId: string): Promise<void>              — missing from declared interface
\`\`\`
```

---

## `## Findings`

Recorded by the human during review. Minor issues that can be fixed in a short loop (re-run build without redesign).

```markdown
## Findings

- Error handling in `validate()` returns generic 500 instead of specific error codes
- Missing input validation on `revoke()` — should reject empty tokenId
```

---

## External Reference Nodes

Dependencies on things outside the project tree (third-party libraries, databases, platform APIs, other services) are represented as components with an `external: true` flag in the design JSON. No implementation is generated for them.

```markdown
---
external: true
---

## Responsibility

PostgreSQL database for persistent storage.

## Exposes

\`\`\`typescript
export interface Database {
  query(sql: string, params: any[]): Promise<Result>
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>
}
\`\`\`
```

External reference nodes participate in the `## Design` of their parent just like any other node. The build system recognises the `external: true` flag and skips agent dispatch for those nodes, but still provides their `## Exposes` to any dependents as context.

---

## Complete Example

```markdown
# Auth Service

## Responsibility

Manages user authentication: validating credentials, issuing tokens, and revoking sessions.

## Design

TBD

## Exposes

\`\`\`typescript
export interface AuthService {
  validate(token: string): Promise<AuthResult>
  revoke(tokenId: string): Promise<void>
}

export interface AuthResult {
  userId: string
  roles: string[]
  expiresAt: number
}
\`\`\`
```
