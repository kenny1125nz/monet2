# AST Analyze

## Responsibility

Inspects source code by parsing it into an AST and extracts the actual design — what the code exports, imports, and how it decomposes into child nodes. Returns a composite node representing the extracted architecture.

## Exposes

```typescript
export interface AstAnalyzer {
  analyze(codebasePath: string): Promise<Node>
}
```

## Acceptance Criteria

- Parses source files into an AST
- Extracts exports (functions, types, classes, their signatures)
- Extracts imports (real dependencies on other nodes or external libraries)
- Returns a composite `Node` with children representing the extracted decomposition
- Reports facade compliance — whether the facade exports match the declared interface

## Quality Metrics

- Extracts all exports and imports from source code
- Correctly distinguishes internal vs external dependencies
- Reports accurate facade compliance status
