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
  type: 'navigate' | 'design' | 'build' | 'analyze' | 'review' | 'exit'
  success: boolean
  message: string
}
```

## Acceptance Criteria

- User can navigate up, down, and across the node tree with `cd` commands
- User can invoke `design`, `build`, `analyze`, `review` on the current node
- User can see a menu of available commands and their descriptions
- One-shot variants exist for scripting/CI: `monet design decompose`, `monet design apply`, `monet design validate`
- The prompt always shows the current node path

## Quality Metrics

- All commands produce clear, actionable output
- Interactive loop provides helpful prompts and error messages
- One-shot commands return appropriate exit codes for CI integration
