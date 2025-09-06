import { useCallback } from 'react'
import type { RefObject } from 'react'

export interface TextEditorAPI {
  getSelection: () => { start: number; end: number; text: string }
  getCursorPosition: () => number
  setCursorPosition: (position: number) => void
  setSelection: (start: number, end: number) => void
  insertText: (text: string) => void
  replaceSelection: (text: string) => void
  getCurrentLine: () => { text: string; lineNumber: number; start: number; end: number }
  getIndentLevel: (line: string) => number
  increaseIndent: () => void
  decreaseIndent: () => void
}

export function useTextEditor(
  textareaRef: RefObject<HTMLTextAreaElement>,
  value: string,
  onChange: (value: string) => void
): TextEditorAPI {
  
  const getSelection = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return { start: 0, end: 0, text: '' }
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = value.substring(start, end)
    
    return { start, end, text }
  }, [textareaRef, value])
  
  const getCursorPosition = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return 0
    return textarea.selectionStart
  }, [textareaRef])
  
  const setCursorPosition = useCallback((position: number) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    textarea.focus()
    textarea.setSelectionRange(position, position)
  }, [textareaRef])
  
  const setSelection = useCallback((start: number, end: number) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    textarea.focus()
    textarea.setSelectionRange(start, end)
  }, [textareaRef])
  
  const insertText = useCallback((text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + text + value.substring(end)
    
    onChange(newValue)
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      setCursorPosition(start + text.length)
    }, 0)
  }, [textareaRef, value, onChange, setCursorPosition])
  
  const replaceSelection = useCallback((text: string) => {
    insertText(text)
  }, [insertText])
  
  const getCurrentLine = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return { text: '', lineNumber: 0, start: 0, end: 0 }
    
    const cursorPos = textarea.selectionStart
    const lines = value.split('\n')
    let currentPos = 0
    
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1 // +1 for newline
      if (currentPos + lineLength > cursorPos) {
        return {
          text: lines[i],
          lineNumber: i,
          start: currentPos,
          end: currentPos + lines[i].length
        }
      }
      currentPos += lineLength
    }
    
    return { text: '', lineNumber: 0, start: 0, end: 0 }
  }, [textareaRef, value])
  
  const getIndentLevel = useCallback((line: string) => {
    const match = line.match(/^(\s*)/)
    return match ? match[1].length : 0
  }, [])
  
  const increaseIndent = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const { start, end } = getSelection()
    const lines = value.split('\n')
    let currentPos = 0
    let newValue = ''
    let addedSpaces = 0
    let cursorAdjustment = 0
    
    for (let i = 0; i < lines.length; i++) {
      const lineStart = currentPos
      const lineEnd = currentPos + lines[i].length
      
      // Check if this line is within selection
      if (lineEnd >= start && lineStart <= end) {
        newValue += '  ' + lines[i]
        addedSpaces += 2
        
        // Adjust cursor if it's on this line
        if (lineStart <= start && start <= lineEnd && cursorAdjustment === 0) {
          cursorAdjustment = 2
        }
      } else {
        newValue += lines[i]
      }
      
      if (i < lines.length - 1) {
        newValue += '\n'
      }
      
      currentPos = lineEnd + 1 // +1 for newline
    }
    
    onChange(newValue)
    
    // Adjust selection/cursor
    setTimeout(() => {
      if (start === end) {
        setCursorPosition(start + cursorAdjustment)
      } else {
        setSelection(start + cursorAdjustment, end + addedSpaces)
      }
    }, 0)
  }, [value, onChange, getSelection, setCursorPosition, setSelection])
  
  const decreaseIndent = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const { start, end } = getSelection()
    const lines = value.split('\n')
    let currentPos = 0
    let newValue = ''
    let removedSpaces = 0
    let cursorAdjustment = 0
    
    for (let i = 0; i < lines.length; i++) {
      const lineStart = currentPos
      const lineEnd = currentPos + lines[i].length
      
      // Check if this line is within selection
      if (lineEnd >= start && lineStart <= end) {
        if (lines[i].startsWith('  ')) {
          newValue += lines[i].substring(2)
          removedSpaces += 2
          
          // Adjust cursor if it's on this line
          if (lineStart <= start && start <= lineEnd && cursorAdjustment === 0) {
            cursorAdjustment = Math.min(2, start - lineStart)
          }
        } else if (lines[i].startsWith(' ')) {
          newValue += lines[i].substring(1)
          removedSpaces += 1
          
          if (lineStart <= start && start <= lineEnd && cursorAdjustment === 0) {
            cursorAdjustment = Math.min(1, start - lineStart)
          }
        } else if (lines[i].startsWith('\t')) {
          newValue += lines[i].substring(1)
          removedSpaces += 1
          
          if (lineStart <= start && start <= lineEnd && cursorAdjustment === 0) {
            cursorAdjustment = Math.min(1, start - lineStart)
          }
        } else {
          newValue += lines[i]
        }
      } else {
        newValue += lines[i]
      }
      
      if (i < lines.length - 1) {
        newValue += '\n'
      }
      
      currentPos = lineEnd + 1 // +1 for newline
    }
    
    onChange(newValue)
    
    // Adjust selection/cursor
    setTimeout(() => {
      if (start === end) {
        setCursorPosition(Math.max(0, start - cursorAdjustment))
      } else {
        setSelection(Math.max(0, start - cursorAdjustment), Math.max(0, end - removedSpaces))
      }
    }, 0)
  }, [value, onChange, getSelection, setCursorPosition, setSelection])
  
  return {
    getSelection,
    getCursorPosition,
    setCursorPosition,
    setSelection,
    insertText,
    replaceSelection,
    getCurrentLine,
    getIndentLevel,
    increaseIndent,
    decreaseIndent
  }
}