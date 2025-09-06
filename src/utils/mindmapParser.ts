import type { MindMapNode } from '../types/MindMap'
import { layoutMindMap } from './treeLayout'

export function parseTextToNodes(text: string): MindMapNode[] {
  const lines = text.split('\n')
  const nodes: MindMapNode[] = []
  const nodeMap: { [key: string]: MindMapNode } = {}
  const levelStack: { level: number; id: string }[] = []
  
  let nodeId = 0
  let currentPos = 0
  
  lines.forEach((line, lineIndex) => {
    const lineStartPos = currentPos
    const lineEndPos = currentPos + line.length
    
    // Determine the level based on indentation
    // For empty lines, use the previous non-empty line's level
    let level = line.search(/\S/)
    // Only trim leading spaces, keep trailing spaces
    const trimmedText = line.trimStart()
    
    // For empty lines, maintain the current hierarchy level
    if (trimmedText === '') {
      // Use the level of the last item on the stack (current depth)
      level = levelStack.length > 0 ? levelStack[levelStack.length - 1].level : 0
    }
    
    // Calculate the actual text positions after trimming leading spaces only
    const leadingSpaces = line.length - line.trimStart().length
    const actualStartPos = lineStartPos + leadingSpaces
    const actualEndPos = lineEndPos  // Keep original end position to include trailing spaces
    
    const node: MindMapNode = {
      id: `node_${nodeId++}`,
      text: trimmedText,
      x: 0,
      y: 0,
      children: [],
      lineNumber: lineIndex,
      startPos: actualStartPos,
      endPos: actualEndPos,
      lineStartPos: lineStartPos,
      lineEndPos: lineEndPos
    }
    
    nodes.push(node)
    nodeMap[node.id] = node
    
    // Process hierarchy for all nodes including empty ones
    while (levelStack.length > 0 && levelStack[levelStack.length - 1].level >= level) {
      levelStack.pop()
    }
    
    if (levelStack.length > 0) {
      const parent = nodeMap[levelStack[levelStack.length - 1].id]
      if (parent) {
        parent.children.push(node.id)
      }
    }
    
    levelStack.push({ level, id: node.id })
    currentPos = lineEndPos + 1 // +1 for newline
  })
  
  if (nodes.length > 0) {
    // Use new tree layout algorithm
    layoutMindMap(nodes)
  }
  
  return nodes
}

export function findNodeAtPosition(nodes: MindMapNode[], position: number): MindMapNode | null {
  for (const node of nodes) {
    // Use full line range if available, otherwise use trimmed range
    const lineStart = node.lineStartPos ?? node.startPos
    const lineEnd = node.lineEndPos ?? node.endPos
    
    if (position >= lineStart && position <= lineEnd) {
      return node
    }
  }
  return null
}

export function findNodeAtLine(nodes: MindMapNode[], lineNumber: number): MindMapNode | null {
  for (const node of nodes) {
    if (node.lineNumber === lineNumber) {
      return node
    }
  }
  return null
}

// Old radial layout - kept for reference
// export function layoutNodes(nodes: MindMapNode[], nodeMap: { [key: string]: MindMapNode }) {
//   ... (old implementation)
// }