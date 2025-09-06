import type { MindMapNode } from '../types/MindMap'

interface NodeLayout {
  node: MindMapNode
  width: number
  height: number
  subtreeHeight: number
  x?: number
  y?: number
}

const NODE_HEIGHT = 40
const NODE_MIN_WIDTH = 100
const NODE_PADDING = 20
const HORIZONTAL_GAP = 120
const VERTICAL_GAP = 10

// Calculate text width (simplified - in real app, use canvas measurement)
function getNodeWidth(text: string): number {
  if (text === '') return 60 // Empty node placeholder width
  // Approximate: 8px per character average
  return Math.max(NODE_MIN_WIDTH, text.length * 8 + NODE_PADDING * 2)
}

// Phase 1: Calculate sizes bottom-up
export function calculateNodeSizes(
  nodes: MindMapNode[]
): Map<string, NodeLayout> {
  const layoutMap = new Map<string, NodeLayout>()
  
  // Initialize all nodes with their basic dimensions
  nodes.forEach(node => {
    layoutMap.set(node.id, {
      node,
      width: getNodeWidth(node.text),
      height: NODE_HEIGHT,
      subtreeHeight: NODE_HEIGHT
    })
  })
  
  // Calculate subtree heights bottom-up
  function calculateSubtreeHeight(nodeId: string): number {
    const layout = layoutMap.get(nodeId)
    if (!layout) return 0
    
    const node = layout.node
    if (node.children.length === 0) {
      return NODE_HEIGHT
    }
    
    // Sum of all children's subtree heights plus gaps
    let totalHeight = 0
    node.children.forEach((childId, index) => {
      const childHeight = calculateSubtreeHeight(childId)
      totalHeight += childHeight
      if (index > 0) {
        totalHeight += VERTICAL_GAP
      }
    })
    
    // Update this node's subtree height
    layout.subtreeHeight = Math.max(NODE_HEIGHT, totalHeight)
    return layout.subtreeHeight
  }
  
  // Start from root (assuming first node is root)
  if (nodes.length > 0) {
    calculateSubtreeHeight(nodes[0].id)
  }
  
  return layoutMap
}

// Phase 2: Assign positions top-down
export function assignNodePositions(
  nodes: MindMapNode[],
  layoutMap: Map<string, NodeLayout>,
  startX: number = 100,
  startY: number = 300
): void {
  if (nodes.length === 0) return
  
  const root = nodes[0]
  const rootLayout = layoutMap.get(root.id)
  if (!rootLayout) return
  
  // Position root (left-aligned)
  rootLayout.x = startX
  rootLayout.y = startY
  root.x = startX
  root.y = startY
  
  // Recursively position children
  function positionChildren(parentId: string) {
    const parentLayout = layoutMap.get(parentId)
    if (!parentLayout || parentLayout.x === undefined || parentLayout.y === undefined) return
    
    const parent = parentLayout.node
    if (parent.children.length === 0) return
    
    // Calculate starting Y position to center children around parent
    let currentY = parentLayout.y - (parentLayout.subtreeHeight - NODE_HEIGHT) / 2
    
    parent.children.forEach((childId) => {
      const childLayout = layoutMap.get(childId)
      if (!childLayout) return
      
      const child = childLayout.node
      
      // Position child to the right of parent (left-aligned)
      childLayout.x = (parentLayout.x ?? 0) + parentLayout.width + HORIZONTAL_GAP
      
      // Center child vertically within its subtree space
      childLayout.y = currentY + childLayout.subtreeHeight / 2
      
      // Update node position
      child.x = childLayout.x
      child.y = childLayout.y
      
      // Move to next child position
      currentY += childLayout.subtreeHeight + VERTICAL_GAP
      
      // Recursively position this child's children
      positionChildren(childId)
    })
  }
  
  positionChildren(root.id)
}

// Main layout function
export function layoutMindMap(
  nodes: MindMapNode[]
): Map<string, NodeLayout> {
  // Phase 1: Calculate sizes
  const layoutMap = calculateNodeSizes(nodes)
  
  // Phase 2: Assign positions
  assignNodePositions(nodes, layoutMap)
  
  return layoutMap
}