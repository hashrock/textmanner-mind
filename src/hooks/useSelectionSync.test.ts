import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSelectionSync } from './useSelectionSync'
import type { MindMapNode } from '../types/MindMap'

describe('useSelectionSync', () => {
  const createMockTextarea = () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'Root\n  Child 1\n  Child 2'
    Object.defineProperty(textarea, 'selectionStart', {
      value: 0,
      writable: true,
      configurable: true
    })
    Object.defineProperty(textarea, 'selectionEnd', {
      value: 0,
      writable: true,
      configurable: true
    })
    textarea.focus = vi.fn()
    textarea.setSelectionRange = vi.fn((start, end) => {
      Object.defineProperty(textarea, 'selectionStart', {
        value: start,
        writable: true,
        configurable: true
      })
      Object.defineProperty(textarea, 'selectionEnd', {
        value: end,
        writable: true,
        configurable: true
      })
    })
    return textarea
  }

  const mockNodes: MindMapNode[] = [
    {
      id: 'node_0',
      text: 'Root',
      x: 400,
      y: 300,
      children: ['node_1', 'node_2'],
      lineNumber: 0,
      startPos: 0,
      endPos: 4
    },
    {
      id: 'node_1',
      text: 'Child 1',
      x: 250,
      y: 300,
      children: [],
      lineNumber: 1,
      startPos: 5,
      endPos: 14
    },
    {
      id: 'node_2',
      text: 'Child 2',
      x: 550,
      y: 300,
      children: [],
      lineNumber: 2,
      startPos: 15,
      endPos: 24
    }
  ]

  describe('selectionState', () => {
    it('initializes with default values', () => {
      const textarea = createMockTextarea()
      const ref = { current: textarea }
      
      const { result } = renderHook(() => useSelectionSync(ref as any, mockNodes))
      
      expect(result.current.selectionState).toEqual({
        cursorPos: 0,
        selectionStart: 0,
        selectionEnd: 0,
        activeNodeId: 'node_0' // First node at position 0
      })
    })

    it('updates when cursor moves', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 7, writable: true })
      Object.defineProperty(textarea, 'selectionEnd', { value: 7, writable: true })
      const ref = { current: textarea }
      
      const { result } = renderHook(() => useSelectionSync(ref as any, mockNodes))
      
      act(() => {
        result.current.updateSelection()
      })
      
      expect(result.current.selectionState.cursorPos).toBe(7)
      expect(result.current.selectionState.activeNodeId).toBe('node_1')
    })
  })

  describe('jumpToNode', () => {
    it('moves cursor to node position', () => {
      const textarea = createMockTextarea()
      const ref = { current: textarea }
      
      const { result } = renderHook(() => useSelectionSync(ref as any, mockNodes))
      
      act(() => {
        result.current.jumpToNode(mockNodes[1])
      })
      
      expect(textarea.focus).toHaveBeenCalled()
      expect(textarea.setSelectionRange).toHaveBeenCalledWith(5, 5)
    })
  })

  describe('getCursorPositionInNode', () => {
    it('returns cursor position within active node', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 7, writable: true })
      const ref = { current: textarea }
      
      const { result } = renderHook(() => useSelectionSync(ref as any, mockNodes))
      
      act(() => {
        result.current.updateSelection()
      })
      
      const cursorPos = result.current.getCursorPositionInNode(mockNodes[1])
      expect(cursorPos).toBe(0) // At the beginning of "Child 1" after trimming indent
    })

    it('returns null for non-active node', () => {
      const textarea = createMockTextarea()
      const ref = { current: textarea }
      
      const { result } = renderHook(() => useSelectionSync(ref as any, mockNodes))
      
      const cursorPos = result.current.getCursorPositionInNode(mockNodes[2])
      expect(cursorPos).toBe(null)
    })
  })

  describe('getSelectionInNode', () => {
    it('returns selection range within node', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 7, writable: true })
      Object.defineProperty(textarea, 'selectionEnd', { value: 12, writable: true })
      const ref = { current: textarea }
      
      const { result } = renderHook(() => useSelectionSync(ref as any, mockNodes))
      
      act(() => {
        result.current.updateSelection()
      })
      
      const selection = result.current.getSelectionInNode(mockNodes[1])
      expect(selection).toEqual({ start: 0, end: 5 }) // "Child" selected
    })

    it('returns null for node without selection', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 0, writable: true })
      Object.defineProperty(textarea, 'selectionEnd', { value: 0, writable: true })
      const ref = { current: textarea }
      
      const { result } = renderHook(() => useSelectionSync(ref as any, mockNodes))
      
      const selection = result.current.getSelectionInNode(mockNodes[2])
      expect(selection).toBe(null)
    })

    it('handles partial selection overlap', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 3, writable: true })
      Object.defineProperty(textarea, 'selectionEnd', { value: 10, writable: true })
      const ref = { current: textarea }
      
      const { result } = renderHook(() => useSelectionSync(ref as any, mockNodes))
      
      act(() => {
        result.current.updateSelection()
      })
      
      // Selection spans from "t" in "Root" to middle of "Child 1"
      const selection1 = result.current.getSelectionInNode(mockNodes[0])
      expect(selection1).toEqual({ start: 3, end: 4 }) // "t" in "Root"
      
      const selection2 = result.current.getSelectionInNode(mockNodes[1])
      expect(selection2).toEqual({ start: 0, end: 3 }) // "Chi" in "Child 1"
    })
  })
})