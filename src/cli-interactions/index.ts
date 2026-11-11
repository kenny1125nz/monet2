import * as readline from 'readline'
import * as path from 'path'
import * as fs from 'fs'
import { nodeParser } from '../node-parsing/index.js'
import { designer } from '../design/index.js'
import { log } from '../utils/index.js'

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
  const exists = fs.existsSync(path.join(nodePath, 'node.md'))
  log.debug('nodeExists', { nodePath, exists })
  return exists
}

function findNearestNodeDir(startDir: string): string | null {
  log.debug('findNearestNodeDir: starting', { startDir })
  let dir = startDir
  while (true) {
    if (nodeExists(dir)) {
      log.debug('findNearestNodeDir: found', { dir })
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) {
      log.debug('findNearestNodeDir: reached filesystem root, none found')
      return null
    }
    log.debug('findNearestNodeDir: walking up', { from: dir, to: parent })
    dir = parent
  }
}

function displayPath(session: Session): string {
  return path.relative(session.workspacePath, session.currentPath) || '.'
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

async function handleListChildren(session: Session): Promise<CommandResult> {
  log.debug('handleListChildren', { currentPath: session.currentPath })
  const entries = fs.readdirSync(session.currentPath, { withFileTypes: true })
  const children: { name: string; responsibility: string }[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const childNodePath = path.join(session.currentPath, entry.name, 'node.md')
    if (!fs.existsSync(childNodePath)) continue
    try {
      const node = await nodeParser.parseNodeMd(childNodePath)
      children.push({ name: entry.name, responsibility: node.responsibility })
    } catch {
      children.push({ name: entry.name, responsibility: '(could not parse)' })
    }
  }

  if (children.length === 0) {
    return ok('help', 'No child nodes found under the current node.')
  }

  const lines = children.map(
    (c) => `  ${c.name.padEnd(24)}${c.responsibility.slice(0, 80)}`
  )

  print('Child nodes:\n' + lines.join('\n'))
  return ok('help', `Listed ${children.length} child node(s)`)
}


async function handleNavigate(session: Session, target: string): Promise<CommandResult> {
  log.debug('handleNavigate', { target, currentPath: session.currentPath })
  const resolved = path.isAbsolute(target)
    ? target
    : target === '..'
      ? path.dirname(session.currentPath)
      : path.resolve(session.currentPath, target)

  log.debug('handleNavigate: resolved path', { resolved })

  if (!nodeExists(resolved)) {
    log.debug('handleNavigate: no node.md at resolved path', { resolved })
    return fail('navigate', `No node.md found at ${resolved}`)
  }

  const node = await nodeParser.parseNodeMd(path.join(resolved, 'node.md'))
  session.currentPath = resolved
  log.debug('handleNavigate: navigated', { resolved, responsibility: node.responsibility })
  return ok('navigate', resolved)
}

async function handleDesign(session: Session, subCommand?: string): Promise<CommandResult> {
  log.debug('handleDesign', { subCommand, currentPath: session.currentPath })
  switch (subCommand) {
    case 'decompose': {
      const nodeMdPath = path.join(session.currentPath, 'node.md')
      if (!fs.existsSync(nodeMdPath)) {
        return fail('design', `No node.md found at ${session.currentPath}. Create one first.`, subCommand)
      }
      const node = await nodeParser.parseNodeMd(nodeMdPath)
      print('')
      try {
        await designer.proposeDecomposition(node, (chunk) => process.stdout.write(chunk))
        print('\n')
        return ok('design', '', subCommand)
      } catch (err) {
        return fail('design', `design decompose failed: ${String(err)}`, subCommand)
      }
    }

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

async function handleReview(_session: Session, subCommand?: string): Promise<CommandResult> {
  log.debug('handleReview', { subCommand })
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
    '  ls                     List child nodes of current node',
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
  log.debug('createCommandInterface', { workspacePath })
  const session: Session = { currentPath: workspacePath, workspacePath }

  const iface: CommandInterface = {
    async runCommand(input: string): Promise<CommandResult> {
      const { command, rest } = parseInput(input)
      log.debug('runCommand', { input, command, rest })

      if (command === 'ls') return handleListChildren(session)
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
  log.debug('startInteractiveLoop', { workspacePath, cwd: process.cwd() })

  const startNode = findNearestNodeDir(workspacePath) ?? workspacePath
  log.debug('startInteractiveLoop: resolved startNode', { startNode })

  const cli = createCommandInterface(startNode)
  const session = { currentPath: startNode, workspacePath: startNode }

  print('Monet — type "help" for available commands, "exit" to quit.\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  const prompt = (): string => {
    const rel = path.relative(session.workspacePath, session.currentPath) || '.'
    return `monet [${rel}] > `
  }

  const ask = (): Promise<string> =>
    new Promise((resolve) => rl.question(prompt(), resolve))

  while (true) {
    const input = await ask()
    const result = await cli.runCommand(input)

    if (result.type === 'navigate' && result.success) {
      session.currentPath = result.message
    } else if (result.message) {
      print(result.message)
    }

    if (result.type === 'exit') {
      rl.close()
      break
    }
  }
}
