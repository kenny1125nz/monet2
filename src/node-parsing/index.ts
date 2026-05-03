import * as fs from 'fs'
import * as path from 'path'
import { Node, DataFlowDesign } from '../data-model/node.js'

export interface NodeParser {
  parseNodeMd(filePath: string): Promise<Node>
  parseNodeMdFromContent(content: string): Node
  scanDirectory(dirPath: string): Promise<Node[]>
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  if (!content.startsWith('---\n')) {
    return { frontmatter: {}, body: content }
  }
  const end = content.indexOf('\n---\n', 4)
  if (end === -1) {
    return { frontmatter: {}, body: content }
  }
  const frontmatterStr = content.slice(4, end)
  const body = content.slice(end + 5)

  const frontmatter: Record<string, unknown> = {}
  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const raw = line.slice(colonIdx + 1).trim()
    if (raw === 'true') frontmatter[key] = true
    else if (raw === 'false') frontmatter[key] = false
    else frontmatter[key] = raw
  }

  return { frontmatter, body }
}

function extractSection(content: string, heading: string): string | undefined {
  const match = content.match(new RegExp(`^## ${heading}\\s*$`, 'm'))
  if (!match || match.index === undefined) return undefined

  const rest = content.slice(match.index + match[0].length)
  const nextHeading = rest.match(/^## /m)
  return rest.slice(0, nextHeading?.index ?? rest.length).trim()
}

function extractFirstCodeBlock(content: string, language: string): string | undefined {
  const match = content.match(new RegExp('```' + language + '\\n([\\s\\S]*?)\\n```'))
  return match ? match[1] : undefined
}

function parseDesign(raw: string): DataFlowDesign | undefined {
  const json = extractFirstCodeBlock(raw, 'json')
  if (!json) return undefined
  try {
    return JSON.parse(json) as DataFlowDesign
  } catch {
    return undefined
  }
}

function parseNodeMdFromContent(content: string, name: string = ''): Node {
  const { frontmatter, body } = parseFrontmatter(content)

  const exposesRaw = extractSection(body, 'Exposes')

  const node: Node = {
    name,
    responsibility: extractSection(body, 'Responsibility') ?? '',
    exposes: exposesRaw ? (extractFirstCodeBlock(exposesRaw, 'typescript') ?? exposesRaw) : '',
  }

  const designRaw = extractSection(body, 'Design')
  if (designRaw) {
    const design = parseDesign(designRaw)
    if (design) node.design = design
  }

  const acceptanceCriteria = extractSection(body, 'Acceptance Criteria')
  if (acceptanceCriteria) node.acceptanceCriteria = acceptanceCriteria

  const qualityMetrics = extractSection(body, 'Quality Metrics')
  if (qualityMetrics) node.qualityMetrics = qualityMetrics

  const findings = extractSection(body, 'Findings')
  if (findings) node.findings = findings

  const enhancements = extractSection(body, 'Enhancements')
  if (enhancements) node.enhancements = enhancements

  if (frontmatter.external === true) node.external = true

  return node
}

async function parseNodeMd(filePath: string): Promise<Node> {
  const content = await fs.promises.readFile(filePath, 'utf-8')
  const name = path.basename(path.dirname(filePath))
  return parseNodeMdFromContent(content, name)
}

async function scanDirectory(dirPath: string): Promise<Node[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

  const childNodes: Node[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const childPath = path.join(dirPath, entry.name)
    const nodeMdPath = path.join(childPath, 'node.md')
    try {
      await fs.promises.access(nodeMdPath)
    } catch {
      continue
    }
    const child = await parseNodeMd(nodeMdPath)
    const nested = await scanDirectory(childPath)
    if (nested.length > 0) child.children = nested
    childNodes.push(child)
  }

  return childNodes
}

export const nodeParser: NodeParser = {
  parseNodeMd,
  parseNodeMdFromContent,
  scanDirectory,
}
