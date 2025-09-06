import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Line, Group, Path } from 'react-konva'
import type { MindMapNode, SelectionState } from '../types/MindMap'
import Konva from 'konva'

interface MindMapKonvaProps {
  nodes: MindMapNode[]
  selectionState?: SelectionState
  onNodeClick?: (node: MindMapNode) => void
  getCursorPositionInNode?: (node: MindMapNode) => number | null
  getSelectionInNode?: (node: MindMapNode) => { start: number; end: number } | null
  fullScreen?: boolean
}

export const MindMapKonva: React.FC<MindMapKonvaProps> = ({
  nodes,
  selectionState,
  onNodeClick,
  getCursorPositionInNode,
  getSelectionInNode,
  fullScreen = false
}) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [textWidths, setTextWidths] = useState<Map<string, number>>(new Map())
  const [cursorOffsets, setCursorOffsets] = useState<Map<string, number[]>>(new Map())
  const [stageSize, setStageSize] = useState({ width: 1200, height: 600 })
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)

  // Update stage size when fullScreen changes
  useEffect(() => {
    const updateSize = () => {
      if (fullScreen) {
        setStageSize({
          width: window.innerWidth,
          height: window.innerHeight
        })
      } else {
        // Get the parent container size
        const container = document.querySelector('.mindmap-container')
        if (container) {
          setStageSize({
            width: container.clientWidth,
            height: container.clientHeight
          })
        } else {
          setStageSize({ width: 800, height: 600 })
        }
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [fullScreen])

  // Auto-scroll to selected node when it changes
  useEffect(() => {
    if (!selectionState?.activeNodeId || !stageRef.current) return

    // Find the active node
    const activeNode = nodes.find(node => node.id === selectionState.activeNodeId)
    if (!activeNode) return

    const stage = stageRef.current
    const stageWidth = stageSize.width
    const stageHeight = stageSize.height
    const scale = stageScale

    // Calculate node bounds in stage coordinates
    const nodeWidth = Math.max((textWidths.get(activeNode.id) || 100) + 40, 100)
    const nodeHeight = 32
    
    // Transform node coordinates to screen coordinates considering current stage position and scale
    const nodeScreenX = activeNode.x * scale + stagePosition.x
    const nodeScreenY = (activeNode.y - nodeHeight / 2) * scale + stagePosition.y
    const nodeScreenWidth = nodeWidth * scale
    const nodeScreenHeight = nodeHeight * scale

    // Check if node is fully visible
    const padding = 50 // Padding from edges
    const isVisible = 
      nodeScreenX >= padding &&
      nodeScreenX + nodeScreenWidth <= stageWidth - padding &&
      nodeScreenY >= padding &&
      nodeScreenY + nodeScreenHeight <= stageHeight - padding

    if (!isVisible) {
      // Calculate minimum movement to bring node into view
      let targetX = stagePosition.x
      let targetY = stagePosition.y

      // Check horizontal bounds
      if (nodeScreenX < padding) {
        // Node is too far left, move right
        targetX = padding - activeNode.x * scale
      } else if (nodeScreenX + nodeScreenWidth > stageWidth - padding) {
        // Node is too far right, move left
        targetX = stageWidth - padding - (activeNode.x + nodeWidth) * scale
      }

      // Check vertical bounds
      if (nodeScreenY < padding) {
        // Node is too far up, move down
        targetY = padding - (activeNode.y - nodeHeight / 2) * scale
      } else if (nodeScreenY + nodeScreenHeight > stageHeight - padding) {
        // Node is too far down, move up
        targetY = stageHeight - padding - (activeNode.y + nodeHeight / 2) * scale
      }

      // Set position instantly without animation
      stage.x(targetX)
      stage.y(targetY)
      setStagePosition({ x: targetX, y: targetY })
    }
  }, [selectionState?.activeNodeId, nodes, textWidths, stageSize, stageScale, stagePosition])

  // Measure text widths and character positions
  useEffect(() => {
    const widths = new Map<string, number>()
    const offsets = new Map<string, number[]>()
    const layer = new Konva.Layer()
    const stage = new Konva.Stage({
      container: document.createElement('div'),
      width: 1,
      height: 1
    })
    stage.add(layer)

    nodes.forEach(node => {
      const displayText = node.text === '' ? 'empty' : node.text
      const text = new Konva.Text({
        text: displayText,
        fontSize: 14,
        fontFamily: 'sans-serif',
        fontStyle: node.text === '' ? 'italic' : 'normal'
      })
      widths.set(node.id, text.width())
      
      // Measure position of each character
      if (node.text !== '') {
        const charOffsets: number[] = [0] // Start position
        for (let i = 0; i < node.text.length; i++) {
          const partialText = new Konva.Text({
            text: node.text.substring(0, i + 1),
            fontSize: 14,
            fontFamily: 'sans-serif',
            fontStyle: 'normal'
          })
          charOffsets.push(partialText.width())
        }
        offsets.set(node.id, charOffsets)
      } else {
        // For empty nodes, set a single offset at position 0
        offsets.set(node.id, [0])
      }
    })

    stage.destroy()
    setTextWidths(widths)
    setCursorOffsets(offsets)
  }, [nodes, selectionState])

  const handleNodeClick = useCallback((node: MindMapNode) => {
    if (onNodeClick) {
      onNodeClick(node)
    }
    // The auto-scroll will be triggered by the selectionState change
  }, [onNodeClick])

  const handleNodeDoubleClick = useCallback((node: MindMapNode) => {
    // Select text without leading spaces on double click
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      textarea.focus()
      // Use the trimmed text positions (startPos and endPos)
      // which already exclude leading and trailing spaces
      textarea.setSelectionRange(node.startPos, node.endPos)
      document.dispatchEvent(new Event('selectionchange', { bubbles: true }))
    }
  }, [])

  // Handle wheel for zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const scaleBy = 1.05
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    
    // Limit zoom
    const limitedScale = Math.max(0.2, Math.min(3, newScale))
    
    setStageScale(limitedScale)
    
    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    }
    
    setStagePosition(newPos)
  }, [])

  if (nodes.length === 0) {
    return (
      <div className={fullScreen ? "mindmap-fullscreen" : "mindmap-pane"}>
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer />
        </Stage>
      </div>
    )
  }

  // Create node map for quick lookup
  const nodeMap: { [key: string]: MindMapNode } = {}
  nodes.forEach(node => {
    nodeMap[node.id] = node
  })

  return (
    <div className={fullScreen ? "mindmap-fullscreen" : "mindmap-pane"}>
      <Stage 
        ref={stageRef}
        width={stageSize.width} 
        height={stageSize.height}
        style={{ 
          backgroundColor: 'white' 
        }}
        draggable={true}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          const stage = e.currentTarget
          setStagePosition({
            x: stage.x(),
            y: stage.y()
          })
        }}
        onDragMove={(e) => {
          const stage = e.currentTarget
          // Update position during drag for smooth interaction
          setStagePosition({
            x: stage.x(),
            y: stage.y()
          })
        }}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={stageScale}
        scaleY={stageScale}
      >
        <Layer>
          {/* Draw Bezier curve connections first */}
          {nodes.map(node => (
            node.children.map(childId => {
              const child = nodeMap[childId]
              if (!child) return null
              
              // Calculate bezier control points (left-aligned nodes)
              const parentWidth = textWidths.get(node.id) || 100
              const startX = node.x + parentWidth + 40 // Right side of parent with padding
              const startY = node.y
              const endX = child.x // Left side of child
              const endY = child.y
              
              // Control points for smooth curve
              const controlOffset = Math.abs(endX - startX) * 0.5
              const path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`
              
              return (
                <Path
                  key={`${node.id}-${childId}`}
                  data={path}
                  stroke="#808080"
                  strokeWidth={1}
                  fill="transparent"
                  lineCap="round"
                  lineJoin="round"
                />
              )
            })
          )).flat()}

          {/* Draw nodes */}
          {nodes.map((node, index) => {
            const isEmptyNode = node.text === ''
            const isRoot = index === 0
            const isActive = selectionState?.activeNodeId === node.id
            const displayText = isEmptyNode ? 'empty' : node.text
            const textWidth = textWidths.get(node.id) || 100
            const padding = 20
            const minWidth = isRoot ? 100 : 80
            const rectWidth = Math.max(textWidth + padding * 2, minWidth)
            const rectHeight = 32

            // Get selection range for this node
            const selection = getSelectionInNode ? getSelectionInNode(node) : null
            const cursorPos = getCursorPositionInNode ? getCursorPositionInNode(node) : null
            
            // Node rendering calculation complete

            return (
              <Group
                key={node.id}
                onClick={() => handleNodeClick(node)}
                onDblClick={() => handleNodeDoubleClick(node)}
                onTap={() => handleNodeClick(node)}
                onDblTap={() => handleNodeDoubleClick(node)}
              >
                {/* Node background - all nodes as rounded rectangles for consistency */}
                <Rect
                  x={node.x}
                  y={node.y - rectHeight / 2}
                  width={rectWidth}
                  height={rectHeight}
                  cornerRadius={4}
                  fill={
                    isActive ? (isRoot ? '#333333' : '#f0f0f0') : 
                    isRoot ? '#000000' : 
                    isEmptyNode ? '#fafafa' : 
                    '#ffffff'
                  }
                  stroke={isActive ? '#000000' : (isRoot ? '#000000' : '#808080')}
                  strokeWidth={isActive ? 2 : 1}
                />

                {/* Selection highlight */}
                {selection && selection.start !== selection.end && node.text.length > 0 && (
                  <Rect
                    x={node.x + padding + (cursorOffsets.get(node.id)?.[selection.start] || 0)}
                    y={node.y - 10}
                    width={(cursorOffsets.get(node.id)?.[selection.end] || 0) - (cursorOffsets.get(node.id)?.[selection.start] || 0)}
                    height={20}
                    fill="rgba(0, 0, 0, 0.2)"
                    listening={false}
                  />
                )}

                {/* Node text */}
                <Text
                  x={node.x + padding}
                  y={node.y - 7}
                  text={displayText}
                  fontSize={14}
                  fontFamily="sans-serif"
                  fill={isRoot ? '#ffffff' : (isEmptyNode ? '#808080' : '#000000')}
                  fontStyle={isEmptyNode ? 'italic' : 'normal'}
                  listening={false}
                />

                {/* Cursor indicator */}
                {isActive && cursorPos !== null && (
                  <Line
                    points={[
                      node.x + padding + (node.text.length === 0 ? 0 : (cursorOffsets.get(node.id)?.[cursorPos] || 0)),
                      node.y - 10,
                      node.x + padding + (node.text.length === 0 ? 0 : (cursorOffsets.get(node.id)?.[cursorPos] || 0)),
                      node.y + 10
                    ]}
                    stroke={isRoot ? "#ffffff" : "#000000"}
                    strokeWidth={1.5}
                    listening={false}
                  />
                )}
              </Group>
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}