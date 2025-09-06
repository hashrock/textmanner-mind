import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTextEditor } from './useTextEditor'

describe('useTextEditor', () => {
  const createMockTextarea = () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'Test\n  Child 1\n    Grandchild\n  Child 2'
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

  describe('getSelection', () => {
    it('returns current selection', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 5, writable: true })
      Object.defineProperty(textarea, 'selectionEnd', { value: 10, writable: true })
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, vi.fn())
      })
      
      const selection = result.current.getSelection()
      expect(selection.start).toBe(5)
      expect(selection.end).toBe(10)
      expect(selection.text).toBe('  Chi')
    })
  })

  describe('getCursorPosition', () => {
    it('returns current cursor position', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 15, writable: true })
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, vi.fn())
      })
      
      expect(result.current.getCursorPosition()).toBe(15)
    })
  })

  describe('setCursorPosition', () => {
    it('sets cursor to specified position', () => {
      const textarea = createMockTextarea()
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, vi.fn())
      })
      
      act(() => {
        result.current.setCursorPosition(10)
      })
      
      expect(textarea.focus).toHaveBeenCalled()
      expect(textarea.setSelectionRange).toHaveBeenCalledWith(10, 10)
    })
  })

  describe('setSelection', () => {
    it('sets selection range', () => {
      const textarea = createMockTextarea()
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, vi.fn())
      })
      
      act(() => {
        result.current.setSelection(5, 15)
      })
      
      expect(textarea.focus).toHaveBeenCalled()
      expect(textarea.setSelectionRange).toHaveBeenCalledWith(5, 15)
    })
  })

  describe('getCurrentLine', () => {
    it('returns current line information', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 7, writable: true }) // Inside "  Child 1" line
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, vi.fn())
      })
      
      const lineInfo = result.current.getCurrentLine()
      expect(lineInfo.text).toBe('  Child 1')
      expect(lineInfo.lineNumber).toBe(1)
    })
  })

  describe('getIndentLevel', () => {
    it('returns indent level of a line', () => {
      const textarea = createMockTextarea()
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, vi.fn())
      })
      
      expect(result.current.getIndentLevel('Test')).toBe(0)
      expect(result.current.getIndentLevel('  Child')).toBe(2)
      expect(result.current.getIndentLevel('    Grandchild')).toBe(4)
    })
  })

  describe('insertText', () => {
    it('inserts text at cursor position', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 4, writable: true })
      Object.defineProperty(textarea, 'selectionEnd', { value: 4, writable: true })
      const onChange = vi.fn()
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, onChange)
      })
      
      act(() => {
        result.current.insertText(' NEW')
      })
      
      expect(onChange).toHaveBeenCalledWith('Test NEW\n  Child 1\n    Grandchild\n  Child 2')
    })
  })

  describe('increaseIndent', () => {
    it('adds indent to current line', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 0, writable: true })
      Object.defineProperty(textarea, 'selectionEnd', { value: 0, writable: true })
      const onChange = vi.fn()
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, onChange)
      })
      
      act(() => {
        result.current.increaseIndent()
      })
      
      expect(onChange).toHaveBeenCalledWith('  Test\n  Child 1\n    Grandchild\n  Child 2')
    })

    it('adds indent to multiple selected lines', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 0, writable: true })
      Object.defineProperty(textarea, 'selectionEnd', { value: 13, writable: true }) // Covers "Test" and "  Child 1"
      const onChange = vi.fn()
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, onChange)
      })
      
      act(() => {
        result.current.increaseIndent()
      })
      
      expect(onChange).toHaveBeenCalledWith('  Test\n    Child 1\n    Grandchild\n  Child 2')
    })
  })

  describe('decreaseIndent', () => {
    it('removes indent from current line', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 5, writable: true }) // On "  Child 1"
      Object.defineProperty(textarea, 'selectionEnd', { value: 5, writable: true })
      const onChange = vi.fn()
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, onChange)
      })
      
      act(() => {
        result.current.decreaseIndent()
      })
      
      expect(onChange).toHaveBeenCalledWith('Test\nChild 1\n    Grandchild\n  Child 2')
    })

    it('handles lines with no indent', () => {
      const textarea = createMockTextarea()
      Object.defineProperty(textarea, 'selectionStart', { value: 0, writable: true }) // On "Test" which has no indent
      Object.defineProperty(textarea, 'selectionEnd', { value: 0, writable: true })
      const onChange = vi.fn()
      
      const { result } = renderHook(() => {
        const ref = { current: textarea }
        return useTextEditor(ref as any, textarea.value, onChange)
      })
      
      act(() => {
        result.current.decreaseIndent()
      })
      
      // Should not change since "Test" has no indent
      expect(onChange).toHaveBeenCalledWith('Test\n  Child 1\n    Grandchild\n  Child 2')
    })
  })
})