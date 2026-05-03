import * as readline from 'readline'
import * as path from 'path'
import * as fs from 'fs'
import { nodeParser } from '../node-parsing/index.js'

export interface CommandResult {
  type: 'navigate' | 'design' | 'build' | 'review' | 'help' | 'exit'
  subCommand?: string
  success: boolean
  message: string
}

export interface CommandInterface {
  runCommand(input: string): Promise<CommandResult>
  navigate(target: string): Promise<void>
  showMenu(): Promise<void>
}

// ── Session state ─────────────────────────────────────────────────────────────

interface Session {
  currentPath: string
  workspacePath: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nodeExists(nodePath: string): boolean {
  return fs.existsSync(path.join(nodePath, 'node.md'))
}

function displayPath(session: Session): string {
  const rel = path.relative(session.workspacePath, session.currentPath) || '.'
  return rel
}

function ok(type: CommandResult['type'], message: string, subCommand?: string): CommandResult {
  return { type, subCommand, success: true, message }
}

function fail(type: CommandResult['type'], message: string, subCommand?: string): CommandResult {
  return { type, subCommand, success: false, message }
}

function print(message: string): void {
  process.stdout.write(message + '\n')
}

// ── Command handlers ──────────────────────────────────────────────────────────

async function handleNavigate(session: Session, target: string): Promise<CommandResult> {
  const resolved = path.isAbsolute(target)
    ? target
    : target === '..'
    ? path.dirname(session.currentPath)
    : path.resolve(session.currentPath, target)

  if (!nodeExists(resolved)) {
    return fail('navigate', `No node.md found at ${resolved}`)
  }

  const node = await nodeParser.parseNodeMd(path.join(resolved, 'node.md'))
  session.currentPath = resolved
  print(`→ ${displayPath(session)}  ${node.responsibility ? `— ${node.responsibility}` : ''}`)
  return ok('navigate', resolved)
}

async function handleDesign(session: Session, subCommand?: string): Promise<CommandResult> {
  switch (subCommand) {
    case 'decompose':
      // TODO: invoke Design capability — AI proposes child node decomposition
      return fail('design', 'design decompose: not yet implemented', subCommand)

    case 'apply':
      // TODO: read ## Design flow graph and materialise directories + node.md stubs
      return fail('design', 'design apply: not yet implemented', subCommand)

    case 'validate':
      // TODO: structural validation — edges resolve, no cycles, interfaces present
      return fail('design', 'design validate: not yet implemented', subCommand)

    case 'view':
      // TODO: open DesignPresenter GUI for intended design
      return fail('design', 'design view: not yet implemented', subCommand)

    case 'grill':
      // TODO: AI-assisted review and questioning of current node's definition
      return fail('design', 'design grill: not yet implemented', subCommand)

    default:
      return fail('design', `Unknown design sub-command: "${subCommand}". Try: decompose, apply, validate, view, grill`)
  }
}

async function handleBuild(_session: Session): Promise<CommandResult> {
  // TODO: invoke agent-based implementation — reads design, dispatches coding agents wave by wave
  return fail('build', 'build: not yet implemented')
}

async function handleReview(session: Session, subCommand?: string): Promise<CommandResult> {
  switch (subCommand) {
    case 'analyze':
      // TODO: run AST-based drift analysis on implemented code
      return fail('review', 'review analyze: not yet implemented', subCommand)

    case 'report':
      // TODO: consolidate node bundles into structured review
      return fail('review', 'review report: not yet implemented', subCommand)

    case 'view':
      // TODO: open DesignPresenter comparison view (intended vs actual)
      return fail('review', 'review view: not yet implemented', subCommand)

    default:
      return fail('review', `Unknown review sub-command: "${subCommand}". Try: analyze, report, view`)
  }
}

function handleHelp(): CommandResult {
  const lines = [
    '',
    'Navigation',
    '  cd ..                  Move up to parent node',
    '  cd <path>              Move to a child or sibling node',
    '',
    'Design',
    '  design decompose       AI proposes child node decomposition',
    '  design apply           Materialise flow graph into filesystem',
    '  design validate        Validate node tree structure',
    '  design view            Visualise intended design',
    '  design grill           AI-assisted review of current node',
    '',
    'Build',
    '  build                  Implement nodes via coding agents',
    '',
    'Review',
    '  review analyze         Run AST drift analysis',
    '  review report          Consolidated review report',
    '  review view            Visualise implementation or comparison',
    '',
    'Other',
    '  help                   Show this menu',
    '  exit / quit            Exit the session',
    '',
  ]
  print(lines.join('\n'))
  return ok('help', 'help shown')
}

// ── Input parsing ─────────────────────────────────────────────────────────────

function parseInput(raw: string): { command: string; rest: string[] } {
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  return { command: parts[0] ?? '', rest: parts.slice(1) }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createCommandInterface(workspacePath: string): CommandInterface {
  const session: Session = { currentPath: workspacePath, workspacePath }

  const iface: CommandInterface = {
    async runCommand(input: string): Promise<CommandResult> {
      const { command, rest } = parseInput(input)

      if (command === 'cd') return handleNavigate(session, rest[0] ?? '..')
      if (command === 'design') return handleDesign(session, rest[0])
      if (command === 'build') return handleBuild(session)
      if (command === 'review') return handleReview(session, rest[0])
      if (command === 'help') return handleHelp()
      if (command === 'exit' || command === 'quit') return ok('exit', 'bye')
      if (command === '') return ok('help', '')

      return fail('help', `Unknown command: "${command}". Type "help" to see available commands.`)
    },

    async navigate(target: string): Promise<void> {
      const result = await handleNavigate(session, target)
      if (!result.success) print(result.message)
    },

    async showMenu(): Promise<void> {
      handleHelp()
    },
  }

  return iface
}

// ── Interactive loop ──────────────────────────────────────────────────────────

export async function startInteractiveLoop(workspacePath: string): Promise<void> {
  if (!nodeExists(workspacePath)) {
    print(`Error: no node.md found at ${workspacePath}. Run "monet init" first.`)
    process.exit(1)
  }

  const cli = createCommandInterface(workspacePath)
  const session = { currentPath: workspacePath, workspacePath }

  print('Monet — type "help" for available commands, "exit" to quit.\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  const prompt = (): string => {
    const rel = path.relative(workspacePath, session.currentPath) || '.'
    return `monet [${rel}] > `
  }

  const ask = (): Promise<string> =>
    new Promise((resolve) => rl.question(prompt(), resolve))

  while (true) {
    const input = await ask()
    const result = await cli.runCommand(input)

    if (result.type === 'navigate' && result.success) {
      // session.currentPath updated inside handleNavigate via shared session ref
    } else if (!result.success && result.message) {
      print(result.message)
    } else if (result.message) {
      print(result.message)
    }

    if (result.type === 'exit') {
      rl.close()
      break
    }
  }
}
