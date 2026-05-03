import * as fs from 'fs'
import * as path from 'path'
import { Node } from '../data-model/node.js'

/**
 * Generates the content of a node.md file from a Node object.
 */
function generateNodeMd(node: Node): string {
    const lines: string[] = []

    // Frontmatter for external nodes
    if (node.external) {
        lines.push('---')
        lines.push('external: true')
        lines.push('---')
        lines.push('')
    }

    lines.push(`# ${node.name}`)
    lines.push('')

    // Responsibility
    lines.push('## Responsibility')
    lines.push('')
    lines.push(node.responsibility || 'TBD')
    lines.push('')

    // Exposes
    lines.push('## Exposes')
    lines.push('')
    if (node.exposes) {
        lines.push('```typescript')
        lines.push(node.exposes)
        lines.push('```')
    } else {
        lines.push('```typescript')
        lines.push('// TBD')
        lines.push('```')
    }
    lines.push('')

    // Acceptance Criteria
    if (node.acceptanceCriteria) {
        lines.push('## Acceptance Criteria')
        lines.push('')
        lines.push(node.acceptanceCriteria)
        lines.push('')
    }

    // Quality Metrics
    if (node.qualityMetrics) {
        lines.push('## Quality Metrics')
        lines.push('')
        lines.push(node.qualityMetrics)
        lines.push('')
    }

    // Design (data flow)
    if (node.design) {
        lines.push('## Design')
        lines.push('')
        lines.push('```json')
        lines.push(JSON.stringify(node.design, null, 2))
        lines.push('```')
        lines.push('')
    }

    // Findings
    if (node.findings) {
        lines.push('## Findings')
        lines.push('')
        lines.push(node.findings)
        lines.push('')
    }

    // Enhancements
    if (node.enhancements) {
        lines.push('## Enhancements')
        lines.push('')
        lines.push(node.enhancements)
        lines.push('')
    }

    return lines.join('\n')
}

/**
 * Recursively scaffold a node and all its children into the filesystem.
 *
 * For each node:
 *   - Creates a directory named after the node under the given parent path
 *   - Writes a node.md file seeded with the node's data
 *
 * Existing directories and node.md files are left untouched (idempotent).
 *
 * @param node - The node to scaffold (may contain children).
 * @param parentPath - The absolute path of the parent directory where this node's folder will be created.
 */
async function scaffoldNode(node: Node, parentPath: string): Promise<void> {
    const nodeDir = path.join(parentPath, node.name)

    // Create the directory if it doesn't exist
    await fs.promises.mkdir(nodeDir, { recursive: true })

    // Write node.md — but only if it doesn't already exist (idempotent)
    const nodeMdPath = path.join(nodeDir, 'node.md')
    try {
        await fs.promises.access(nodeMdPath)
        // File exists — skip
    } catch {
        // File doesn't exist — create it
        const content = generateNodeMd(node)
        await fs.promises.writeFile(nodeMdPath, content, 'utf-8')
    }

    // Recurse into children
    if (node.children) {
        for (const child of node.children) {
            await scaffoldNode(child, nodeDir)
        }
    }
}

export interface Scaffolder {
    scaffold(node: Node, parentPath: string): Promise<void>
}

export const scaffolder: Scaffolder = {
    async scaffold(node: Node, parentPath: string): Promise<void> {
        await scaffoldNode(node, parentPath)
    },
}
