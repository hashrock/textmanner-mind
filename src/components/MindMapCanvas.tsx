import React, { useRef, useEffect, useCallback } from 'react'
import type { MindMapNode, SelectionState } from '../types/MindMap'

interface MindMapCanvasProps {
  nodes: MindMapNode[]
  selectionState?: SelectionState
  onNodeClick?: (node: MindMapNode) => void
  getCursorPositionInNode?: (node: MindMapNode) => number | null
  getSelectionInNode?: (node: MindMapNode) => { start: number; end: number } | null
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ 
  nodes, 
  selectionState,
  onNodeClick,
  getCursorPositionInNode,
  getSelectionInNode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodeRectsRef = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map())

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onNodeClick) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Find clicked node
    for (const [nodeId, nodeRect] of nodeRectsRef.current.entries()) {
      if (x >= nodeRect.x - nodeRect.width / 2 && 
          x <= nodeRect.x + nodeRect.width / 2 &&
          y >= nodeRect.y - nodeRect.height / 2 && 
          y <= nodeRect.y + nodeRect.height / 2) {
        const node = nodes.find(n => n.id === nodeId)
        if (node) {
          onNodeClick(node)
          break
        }
      }
    }
  }, [nodes, onNodeClick])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    drawMindMap(
      ctx, 
      nodes, 
      canvas.width, 
      canvas.height, 
      nodeRectsRef.current,
      selectionState,
      getCursorPositionInNode,
      getSelectionInNode
    )
  }, [nodes, selectionState, getCursorPositionInNode, getSelectionInNode])

  return (
    <div className="mindmap-pane">
      <h2>マインドマップ</h2>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}
        aria-label="マインドマップキャンバス"
        onClick={handleCanvasClick}
      />
    </div>
  )
}

function drawMindMap(
  ctx: CanvasRenderingContext2D, 
  nodes: MindMapNode[], 
  width: number, 
  height: number,
  nodeRects: Map<string, { x: number; y: number; width: number; height: number }>,
  selectionState?: SelectionState,
  getCursorPositionInNode?: (node: MindMapNode) => number | null,
  getSelectionInNode?: (node: MindMapNode) => { start: number; end: number } | null
) {
  ctx.clearRect(0, 0, width, height)
  nodeRects.clear()
  
  if (nodes.length === 0) return
  
  const nodeMap: { [key: string]: MindMapNode } = {}
  nodes.forEach(node => {
    nodeMap[node.id] = node
  })
  
  // Draw connections first (behind nodes)
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2
  nodes.forEach(node => {
    node.children.forEach(childId => {
      const child = nodeMap[childId]
      if (child) {
        ctx.beginPath()
        ctx.moveTo(node.x, node.y)
        ctx.lineTo(child.x, child.y)
        ctx.stroke()
      }
    })
  })
  
  // Setup font for text measurement
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Draw nodes with properly sized backgrounds
  nodes.forEach(node => {
    const isRoot = nodes[0].id === node.id
    const isActive = selectionState?.activeNodeId === node.id
    
    // Measure actual text width
    const textMetrics = ctx.measureText(node.text)
    const textWidth = textMetrics.width
    const padding = 20
    const minWidth = isRoot ? 100 : 80
    const rectWidth = Math.max(textWidth + padding * 2, minWidth)
    const rectHeight = 32
    
    // Store node rect for click detection
    nodeRects.set(node.id, {
      x: node.x,
      y: node.y,
      width: rectWidth,
      height: rectHeight
    })
    
    if (isRoot) {
      // Draw root node as ellipse
      ctx.fillStyle = isActive ? '#ff4444' : '#ff6b6b'
      ctx.beginPath()
      ctx.ellipse(node.x, node.y, rectWidth / 2, rectHeight / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // Active border
      if (isActive) {
        ctx.strokeStyle = '#ff0000'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      
      ctx.fillStyle = 'white'
    } else {
      // Draw child nodes as rounded rectangles
      const radius = 4
      const x = node.x - rectWidth / 2
      const y = node.y - rectHeight / 2
      
      // Background
      ctx.fillStyle = isActive ? '#e8f4ff' : '#f8f9fa'
      ctx.beginPath()
      ctx.roundRect(x, y, rectWidth, rectHeight, radius)
      ctx.fill()
      
      // Border
      ctx.strokeStyle = isActive ? '#0066cc' : '#dee2e6'
      ctx.lineWidth = isActive ? 2 : 1
      ctx.stroke()
      
      ctx.fillStyle = '#333'
    }
    
    // Draw selection highlight within node
    if (getSelectionInNode) {
      const selection = getSelectionInNode(node)
      if (selection && selection.start !== selection.end) {
        ctx.save()
        ctx.font = '14px sans-serif'
        
        const beforeText = node.text.substring(0, selection.start)
        const selectedText = node.text.substring(selection.start, selection.end)
        
        const beforeWidth = ctx.measureText(beforeText).width
        const selectedWidth = ctx.measureText(selectedText).width
        
        const startX = node.x - textWidth / 2 + beforeWidth
        
        // Draw selection background
        ctx.fillStyle = 'rgba(100, 150, 255, 0.3)'
        ctx.fillRect(startX, node.y - 10, selectedWidth, 20)
        
        ctx.restore()
      }
    }
    
    // Draw text
    const maxTextWidth = rectWidth - padding
    let displayText = node.text
    
    // Truncate text if too long
    if (textWidth > maxTextWidth) {
      const ellipsis = '...'
      const ellipsisWidth = ctx.measureText(ellipsis).width
      let truncatedText = node.text
      
      while (ctx.measureText(truncatedText).width + ellipsisWidth > maxTextWidth && truncatedText.length > 0) {
        truncatedText = truncatedText.slice(0, -1)
      }
      
      displayText = truncatedText + ellipsis
    }
    
    ctx.fillText(displayText, node.x, node.y)
    
    // Draw cursor/caret within node
    if (getCursorPositionInNode && isActive) {
      const cursorPos = getCursorPositionInNode(node)
      if (cursorPos !== null) {
        ctx.save()
        ctx.font = '14px sans-serif'
        
        const textBeforeCursor = node.text.substring(0, cursorPos)
        const cursorX = node.x - textWidth / 2 + ctx.measureText(textBeforeCursor).width
        
        // Draw cursor line
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cursorX, node.y - 10)
        ctx.lineTo(cursorX, node.y + 10)
        ctx.stroke()
        
        // Blinking effect would require animation frame
        ctx.restore()
      }
    }
  })
}