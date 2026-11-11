#!/usr/bin/env node

import { Command } from 'commander'
import * as path from 'path'
import { version } from '../package.json'
import { createCommandInterface, startInteractiveLoop } from './cli-interactions/index.js'
import { log } from './utils/index.js'

const program = new Command()

program
  .name('monet')
  .description('AI-assisted recursive architecture decomposition')
  .version(version)

// ── Shared helpers ────────────────────────────────────────────────────────────

function workspacePath(): string {
  const cwd = process.cwd()
  log.debug('workspacePath', { cwd })
  return cwd
}

async function runOnce(input: string): Promise<void> {
  const cli = createCommandInterface(workspacePath())
  const result = await cli.runCommand(input)
  if (result.message) process.stdout.write(result.message + '\n')
  process.exit(result.success ? 0 : 1)
}

// ── monet design [sub-command] ────────────────────────────────────────────────

const design = program
  .command('design [sub-command]')
  .description('Enter the interactive design loop, or run a one-shot design sub-command')
  .action(async (subCommand?: string) => {
    if (!subCommand) {
      await startInteractiveLoop(workspacePath())
    } else {
      await runOnce(`design ${subCommand}`)
    }
  })

design.addHelpText('after', `
Sub-commands (one-shot):
  decompose    AI proposes child node decomposition
  apply        Materialise flow graph into filesystem
  validate     Validate node tree structure
  view         Visualise intended design
  grill        AI-assisted review of current node
`)

// ── monet build ───────────────────────────────────────────────────────────────

program
  .command('build')
  .description('Implement nodes via coding agents in topological wave order')
  .action(async () => runOnce('build'))

// ── monet review [sub-command] ────────────────────────────────────────────────

const review = program
  .command('review [sub-command]')
  .description('Enter the interactive review loop, or run a one-shot review sub-command')
  .action(async (subCommand?: string) => {
    if (!subCommand) {
      await startInteractiveLoop(workspacePath())
    } else {
      await runOnce(`review ${subCommand}`)
    }
  })

review.addHelpText('after', `
Sub-commands (one-shot):
  analyze    Run AST drift analysis on implemented code
  report     Consolidate node bundles into a structured review
  view       Visualise implementation or comparison
`)

// ── monet (no command) → interactive loop ────────────────────────────────────

program.action(async () => {
  await startInteractiveLoop(workspacePath())
})

program.parse(process.argv)
