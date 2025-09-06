import { useState, useCallback, useEffect } from 'react'
import type { RefObject } from 'react'
import type { MindMapNode, SelectionState } from '../types/MindMap'
import { findNodeAtPosition } from '../utils/mindmapParser'

export function useSelectionSync(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  nodes: MindMapNode[]
) {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    cursorPos: 0,
    selectionStart: 0,
    selectionEnd: 0,
    activeNodeId: null
  })

  // Update selection state from textarea
  const updateSelectionFromTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    
    // Find the node at cursor position
    const activeNode = findNodeAtPosition(nodes, cursorPos)
    
    
    setSelectionState({
      cursorPos,
      selectionStart,
      selectionEnd,
      activeNodeId: activeNode?.id || null
    })
  }, [textareaRef, nodes])

  // Jump to node position in textarea
  const jumpToNode = useCallback((node: MindMapNode) => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Focus the textarea
    textarea.focus()
    
    // Calculate position after leading spaces
    const lineText = textarea.value.substring(node.startPos, node.endPos)
    const leadingSpaces = lineText.match(/^(\s*)/)?.[1]?.length || 0
    const targetPos = node.startPos + leadingSpaces
    
    // Set selection to skip leading spaces
    textarea.setSelectionRange(targetPos, targetPos)
    
    // Scroll the line into view
    const lines = textarea.value.substring(0, node.startPos).split('\n')
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
    const scrollTop = (lines.length - 1) * lineHeight
    textarea.scrollTop = scrollTop - textarea.clientHeight / 2 + lineHeight
    
    // Update selection state
    updateSelectionFromTextarea()
  }, [textareaRef, updateSelectionFromTextarea])

  // Calculate cursor position within a node
  const getCursorPositionInNode = useCallback((node: MindMapNode): number | null => {
    const { cursorPos, activeNodeId } = selectionState
    
    // Only show cursor for the active node
    if (activeNodeId !== node.id) {
      return null
    }
    
    // Use full line range if available, otherwise use trimmed range
    const lineStart = node.lineStartPos ?? node.startPos
    const lineEnd = node.lineEndPos ?? node.endPos
    
    if (cursorPos >= lineStart && cursorPos <= lineEnd) {
      // Calculate position relative to the text start (after leading spaces)
      const relativePos = cursorPos - node.startPos
      // Return the actual position in the node's text, clamped to text length
      const position = Math.min(Math.max(0, relativePos), node.text.length)
      return position
    }
    
    return null
  }, [selectionState])

  // Calculate selection range within a node
  const getSelectionInNode = useCallback((node: MindMapNode): { start: number; end: number } | null => {
    const { selectionStart, selectionEnd } = selectionState
    
    // Check if selection overlaps with node
    if (selectionEnd >= node.startPos && selectionStart <= node.endPos) {
      // Calculate the actual positions in the node's text (including leading spaces)
      const start = Math.max(0, selectionStart - node.startPos)
      const end = Math.min(node.text.length, selectionEnd - node.startPos)
      
      if (start < end) {  // Only show when there's actual selection
        return { start, end }
      }
    }
    
    return null
  }, [selectionState])

  // Listen for selection changes
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleSelectionChange = () => {
      updateSelectionFromTextarea()
    }

    const handleKeyUp = () => {
      updateSelectionFromTextarea()
    }

    const handleMouseUp = () => {
      updateSelectionFromTextarea()
    }

    textarea.addEventListener('selectionchange', handleSelectionChange)
    textarea.addEventListener('keyup', handleKeyUp)
    textarea.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('selectionchange', handleSelectionChange)

    // Initial update
    updateSelectionFromTextarea()

    return () => {
      textarea.removeEventListener('selectionchange', handleSelectionChange)
      textarea.removeEventListener('keyup', handleKeyUp)
      textarea.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [textareaRef, updateSelectionFromTextarea])

  return {
    selectionState,
    jumpToNode,
    getCursorPositionInNode,
    getSelectionInNode,
    updateSelection: updateSelectionFromTextarea
  }
}