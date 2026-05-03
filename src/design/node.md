# Design

## Responsibility

Enables the user and an AI to collaboratively design a node — decomposing it into children with responsibilities and interfaces, defining data flow between them, and refining any section of the node contract.

## Exposes

```typescript
export interface Designer {
  design(node: Node): Promise<Node>
}
```

## Acceptance Criteria

- Given a node, the AI proposes a decomposition into child nodes with responsibilities and interfaces
- The AI proposes how the children interact (data flow between them)
- The human reviews, refines, and approves the proposed design
- Any section of the node contract can be improved (responsibility, exposes, acceptance criteria, etc.)

## Quality Metrics

- AI proposals are coherent and respect the parent's responsibility boundary
- Human can reject, refine, or accept proposals
