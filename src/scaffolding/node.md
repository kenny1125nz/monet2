# Scaffolding

## Responsibility

Creates the folder structure and initial `node.md` files for a designed node and its children, following a consistent directory pattern where each node is a folder and each child is a subfolder.

## Exposes

```typescript
export interface Scaffolder {
  scaffold(node: Node): Promise<void>
}
```

## Acceptance Criteria

- Creates a folder for the node with a `node.md` file at its root
- Each child node becomes a subfolder under its parent's folder, with its own `node.md`
- The folder structure mirrors the node hierarchy: parent/child/grandchild
- Existing folders and files are left untouched (idempotent)
- The `node.md` files are seeded with the node's name, responsibility, and exposes from the design

## Quality Metrics

- Folder structure exactly matches the node hierarchy
- All created `node.md` files are valid and parseable
- Safe to re-run — no data loss on existing files
