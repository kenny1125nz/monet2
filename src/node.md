# Monet

## Responsibility

Monet is a system for AI-assisted software decomposition, implementation, and drift detection. It enables human and AI to collaboratively decompose a node into children, scaffold implementation from approved designs, analyze generated code to extract its actual design, and present drift between intended and actual design for human review.

The system is recursive — it can be initiated from any node in the project tree, treating that node as the root of the current session.

Configuration is stored in JSON format at `~/.monet/config` (global) with per-project overrides in `.monet/config` within the workspace.

```json
{
  "workspacePath": "/home/user/my-project",
  "llmProviders": {
    "analyze": {
      "apiKey": "sk-...",
      "model": "claude-sonnet-4-20250514",
      "endpoint": "https://api.anthropic.com/v1"
    },
    "plan": {
      "apiKey": "sk-...",
      "model": "claude-opus-4-20250514",
      "endpoint": "https://api.anthropic.com/v1"
    },
    "coding": {
      "apiKey": "sk-...",
      "model": "claude-sonnet-4-20250514",
      "endpoint": "https://api.anthropic.com/v1"
    }
  }
}
```

LLM providers are named by capability (e.g. `analyze`, `plan`, `coding`) rather than by model name, so the system can use the most appropriate model for each task without hardcoding model choices in code.

Command-line arguments specify the target node path and workspace path.

## Exposes

```typescript
export interface Monet {
  run(): Promise<void>
}
```

## Acceptance Criteria

- A user can run Monet from any node in the project tree
- The system reads configuration from a global config file and per-project overrides
- Each capability uses its named LLM provider from config
- The full PDCA cycle is supported: design → build → analyze → review

## Quality Metrics

- Configuration is validated on startup with clear error messages
- Recursive init from any node correctly scopes operations to that subtree
- All capabilities are accessible through the recursive entry point
