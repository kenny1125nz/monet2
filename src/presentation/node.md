# Presentation


## Responsibility

Provides a graphical user interface for visualizing node designs. Can present the intended design (from `node.md`), the implementation design (from AST analysis), or both simultaneously — with drift highlighted naturally as a visual overlay when both are provided.

## Exposes

```typescript
export interface DesignPresenter {
  showIntended(node: Node): Promise<void>
  showImplementation(node: Node): Promise<void>
  showComparison(intended: Node, implementation: Node): Promise<void>
}
```

## Acceptance Criteria

- Can render a single node's intended design as a visual diagram
- Can render a single node's implementation design as a visual diagram
- Can render both designs side by side or overlaid, with differences highlighted
- Drift is a natural visual property of the comparison view, not a separate concept
- User can navigate into child nodes to see their designs

## Quality Metrics

- Visualizations are clear and readable at a glance
- Differences between intended and implementation are immediately obvious
- Navigation between parent and child nodes is intuitive
