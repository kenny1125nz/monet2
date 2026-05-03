# Node Parsing

## Responsibility

Reads and parses `node.md` files — the templated markdown documents that serve as each node's contract — and extracts structured data from them. Every capability in the system depends on this parsing to read node definitions.

## Exposes

```typescript
export interface NodeParser {
  parseNodeMd(filePath: string): Promise<Node>
  parseNodeMdFromContent(content: string): Node
  scanDirectory(dirPath: string): Promise<Node[]>
}
```

## Acceptance Criteria

- Parses YAML frontmatter (e.g., `external: true`) from the top of a `node.md` file
- Extracts the `## Responsibility` section as plain text
- Extracts the `## Exposes` section, parsing TypeScript code blocks into structured interface definitions
- Extracts `## Acceptance Criteria`, `## Quality Metrics`, `## Findings`, and `## Enhancements` as lists
- Handles missing or malformed sections gracefully — returns partial results with clear error indicators
- Supports both reading a single `node.md` file and scanning a directory tree

## Quality Metrics

- Parses all standard `node.md` sections correctly
- Returns partial results with error indicators for malformed input
- Scanning a directory tree discovers all `node.md` files recursively
