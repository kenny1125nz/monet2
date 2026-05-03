# Data Model

## Responsibility

Provides the structured data model that defines what a node is. This is the foundational type system that all other capabilities depend on.

## Exposes

```typescript
export interface Node {
  name: string
  responsibility: string
  exposes: string
  children?: Node[]
  design?: any
  acceptanceCriteria?: string
  qualityMetrics?: string
  findings?: string
  enhancements?: string
  external?: boolean
}
```

## Acceptance Criteria

- A node has a name, responsibility, and exposes
- Nodes can be marked as external
- The data model is stored as files in the project tree, one file per node

## Quality Metrics

- All capabilities can depend on the data model without circular references
- The data model is serializable to/from JSON and markdown
