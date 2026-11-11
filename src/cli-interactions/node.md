# CLI Interactions

## Responsibility

Provides the in-application command interface — sub-commands, command menu, and interactive loop — that lets users navigate the node tree and invoke capabilities during a Monet session.

## Exposes

```typescript
export interface CommandInterface {
  runCommand(input: string): Promise<CommandResult>
  navigate(target: string): Promise<void>
  showMenu(): Promise<void>
}

export interface CommandResult {
  type: 'navigate' | 'design' | 'build' | 'review' | 'help' | 'exit'
  subCommand?: string
  success: boolean
  message: string
}
```

## Acceptance Criteria

- User can list child nodes of the current node with `ls`
- User can navigate up, down, and across the node tree with `cd` commands — navigation works under any phase or sub-command context

- User can invoke top-level phases: `design`, `build`, `review`
- Each phase exposes sub-commands for granular operations:
  - `design decompose` — AI proposes child node decomposition
  - `design apply` — materialises flow graph into filesystem directories (scaffolding)
  - `design validate` — runs structural validation on the node tree
  - `design view` — opens the GUI to visualise the intended design
  - `design grill` — AI-assisted review and questioning of the current node's definition and/or design
  - `review analyze` — runs AST-based drift analysis on implemented code
  - `review report` — consolidates node bundles into a structured review
  - `review view` — opens the GUI to visualise the implementation design or comparison view
- `help` is always available — shows available commands, sub-commands, and usage
- User can see a menu of available commands and their descriptions
- One-shot variants exist for scripting/CI: `monet design decompose`, `monet design apply`, `monet design validate`, `monet review analyze`, `monet review report`
- The prompt always shows the current node path

## Quality Metrics

- All commands produce clear, actionable output
- Interactive loop provides helpful prompts and error messages
- One-shot commands return appropriate exit codes for CI integration
- Sub-commands are discoverable via the menu and `--help` flag
