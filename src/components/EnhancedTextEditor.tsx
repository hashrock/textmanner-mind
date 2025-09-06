import { useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import { useTextEditor } from '../hooks/useTextEditor'
import type { TextEditorAPI } from '../hooks/useTextEditor'

interface EnhancedTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export interface EnhancedTextEditorRef extends TextEditorAPI {}

export const EnhancedTextEditor = forwardRef<EnhancedTextEditorRef, EnhancedTextEditorProps>(
  ({ value, onChange }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [isComposing, setIsComposing] = useState(false)
    const previousPositionRef = useRef<number>(0)
    const api = useTextEditor(textareaRef, value, onChange)
    
    // Expose API through ref
    useImperativeHandle(ref, () => api, [api])
    
    // Handle click to skip leading spaces
    const handleCursorMovement = useCallback(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      
      const { selectionStart, selectionEnd } = textarea
      if (selectionStart !== selectionEnd) return // Don't skip if there's a selection
      
      // Skip to first non-space if clicked in leading spaces
      const lines = value.split('\n')
      let currentPos = 0
      
      for (const line of lines) {
        const lineEnd = currentPos + line.length
        
        // Check if cursor is in this line
        if (selectionStart > currentPos && selectionStart <= lineEnd) {
          const posInLine = selectionStart - currentPos
          const leadingSpaces = line.match(/^(\s*)/)?.[1]?.length || 0
          
          // If cursor is in leading spaces (but not at line start), skip to after spaces
          if (leadingSpaces > 0 && posInLine > 0 && posInLine <= leadingSpaces) {
            const newPos = currentPos + leadingSpaces
            
            setTimeout(() => {
              textarea.setSelectionRange(newPos, newPos)
            }, 0)
          }
          break
        }
        
        currentPos = lineEnd + 1 // +1 for newline
      }
    }, [value])
    
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget
      const { selectionStart, selectionEnd } = textarea
      
      // Store current position for reference
      previousPositionRef.current = selectionStart
      
      // Handle Enter key for auto-indentation FIRST (but not during IME composition)
      if (e.key === 'Enter' && !isComposing) {
        e.preventDefault()
        
        const currentLine = api.getCurrentLine()
        const indentLevel = api.getIndentLevel(currentLine.text)
        const indent = ' '.repeat(indentLevel)
        
        // Check if we're at the end of the line
        const cursorPos = api.getCursorPosition()
        const isAtEndOfLine = cursorPos >= currentLine.end
        
        if (isAtEndOfLine) {
          // At end of line - add indent to new line
          api.insertText('\n' + indent)
        } else {
          // In middle of line - need to handle the text after cursor
          const posInLine = cursorPos - currentLine.start
          const textAfterCursor = currentLine.text.substring(posInLine)
          
          // Remove the text after cursor from current position
          const beforeCursor = value.substring(0, cursorPos)
          const afterLine = value.substring(currentLine.end)
          
          // Trim leading spaces from the text that will go to new line
          const trimmedTextAfter = textAfterCursor.trimStart()
          
          // Set the new value with newline and proper indentation
          const newValue = beforeCursor + '\n' + indent + trimmedTextAfter + afterLine
          onChange(newValue)
          
          // Position cursor at start of new line content
          setTimeout(() => {
            textarea.setSelectionRange(cursorPos + 1 + indent.length, cursorPos + 1 + indent.length)
          }, 0)
        }
        return
      }
      
      // Handle Backspace
      if (e.key === 'Backspace') {
        const lines = value.split('\n')
        let currentPos = 0
        let lineIndex = 0
        
        // Find current line
        for (let i = 0; i < lines.length; i++) {
          if (currentPos + lines[i].length >= selectionStart) {
            lineIndex = i
            break
          }
          currentPos += lines[i].length + 1
        }
        
        const currentLine = lines[lineIndex]
        const lineStartPos = currentPos
        const posInLine = selectionStart - lineStartPos
        
        // Special handling for whitespace-only lines
        if (selectionStart === selectionEnd) {
          // Check if current line is whitespace-only and cursor is at the end
          if (currentLine.trim() === '' && currentLine.length > 0 && posInLine === currentLine.length) {
            e.preventDefault()
            
            // Delete the entire line and move to previous line's end
            if (lineIndex > 0) {
              const prevLineEnd = currentPos - 1
              const newValue = value.substring(0, lineStartPos - 1) + value.substring(lineStartPos + currentLine.length)
              onChange(newValue)
              setTimeout(() => {
                textarea.setSelectionRange(prevLineEnd, prevLineEnd)
              }, 0)
            } else if (lineIndex < lines.length - 1) {
              // First line - remove it
              const newValue = value.substring(lineStartPos + currentLine.length + 1)
              onChange(newValue)
              setTimeout(() => {
                textarea.setSelectionRange(0, 0)
              }, 0)
            } else {
              // Only line - just clear it
              onChange('')
            }
            return
          }
        }
        
        // Check if backspace would result in whitespace-only line
        if (selectionStart !== selectionEnd || posInLine > 0) {
          // Simulate the backspace operation
          let simulatedValue: string
          if (selectionStart !== selectionEnd) {
            // Delete selection
            simulatedValue = value.substring(0, selectionStart) + value.substring(selectionEnd)
          } else if (posInLine > 0) {
            // Delete one character before cursor
            simulatedValue = value.substring(0, selectionStart - 1) + value.substring(selectionStart)
          } else {
            return // Nothing to delete
          }
          
          // Check the resulting line
          const simulatedLines = simulatedValue.split('\n')
          const simulatedLine = simulatedLines[lineIndex]
          
          // If the line would become whitespace-only, delete the entire line
          if (simulatedLine && simulatedLine.trim() === '' && simulatedLine.length > 0) {
            e.preventDefault()
            
            // Delete the entire line and move to previous line's end
            if (lineIndex > 0) {
              const prevLineEnd = lineStartPos - 1
              const newValue = value.substring(0, lineStartPos - 1) + value.substring(lineStartPos + currentLine.length)
              onChange(newValue)
              setTimeout(() => {
                textarea.setSelectionRange(prevLineEnd, prevLineEnd)
              }, 0)
            } else if (lineIndex < lines.length - 1) {
              // First line - remove it
              const newValue = value.substring(lineStartPos + currentLine.length + 1)
              onChange(newValue)
              setTimeout(() => {
                textarea.setSelectionRange(0, 0)
              }, 0)
            } else {
              // Only line - just clear it
              onChange('')
            }
            return
          }
        }
      }
      
      // Handle arrow keys with space skipping
      // Also handle Cmd/Meta+arrow keys for word/line navigation (with or without Shift for selection)
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        // Skip if Shift is pressed WITHOUT Cmd/Meta (regular selection)
        // But allow Shift+Cmd/Meta combinations
        if (e.shiftKey && !e.metaKey && !e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          return // Let default behavior handle Shift+Up/Down
        }
        if (e.shiftKey && !e.metaKey && !e.ctrlKey && selectionStart !== selectionEnd) {
          return // Let default behavior handle extending selection with Shift+Left/Right
        }
        const lines = value.split('\n')
        let currentPos = 0
        let lineIndex = 0
        
        // Use selectionEnd for forward navigation (Right/Down), selectionStart for backward (Left/Up)
        const referencePos = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? selectionEnd : selectionStart
        
        // Find current line based on reference position
        for (let i = 0; i < lines.length; i++) {
          if (currentPos + lines[i].length >= referencePos) {
            lineIndex = i
            break
          }
          currentPos += lines[i].length + 1
        }
        
        const currentLine = lines[lineIndex]
        const leadingSpaces = currentLine.match(/^(\s*)/)?.[1]?.length || 0
        const lineStartPos = currentPos
        const posInLine = referencePos - lineStartPos
        
        if (e.key === 'ArrowLeft') {
          // Handle Cmd/Meta+Left at beginning of line
          if (e.metaKey || e.ctrlKey) {
            // If at beginning of line (including in leading spaces), move to previous line end
            if (posInLine <= leadingSpaces && lineIndex > 0) {
              e.preventDefault()
              const prevLineEndPos = currentPos - 1
              if (e.shiftKey) {
                // Extend selection - keep the other end of selection as anchor
                const anchorPos = selectionStart === selectionEnd ? selectionStart : 
                                  (selectionStart < selectionEnd ? selectionEnd : selectionStart)
                textarea.setSelectionRange(Math.min(anchorPos, prevLineEndPos), Math.max(anchorPos, prevLineEndPos))
              } else {
                // Move cursor
                textarea.setSelectionRange(prevLineEndPos, prevLineEndPos)
              }
              return
            }
          } else {
            // Regular left arrow - skip leading spaces
            // Check if we're about to enter leading spaces from the first non-space position
            if (leadingSpaces > 0 && posInLine === leadingSpaces && selectionStart === selectionEnd) {
              // We're at first non-space, left arrow would move into spaces
              if (lineIndex > 0) {
                e.preventDefault()
                const prevLineEndPos = currentPos - 1
                textarea.setSelectionRange(prevLineEndPos, prevLineEndPos)
                return
              }
            }
          }
        } else if (e.key === 'ArrowRight') {
          // Handle Cmd/Meta+Right at end of line
          if (e.metaKey || e.ctrlKey) {
            // If at end of line, move to next line after leading spaces
            if (posInLine >= currentLine.length && lineIndex < lines.length - 1) {
              e.preventDefault()
              const nextLine = lines[lineIndex + 1]
              const nextLeadingSpaces = nextLine.match(/^(\s*)/)?.[1]?.length || 0
              const nextLineStart = currentPos + currentLine.length + 1
              const targetPos = nextLineStart + nextLeadingSpaces
              if (e.shiftKey) {
                // Extend selection - keep the other end of selection as anchor
                const anchorPos = selectionStart === selectionEnd ? selectionStart : 
                                  (selectionStart < selectionEnd ? selectionStart : selectionEnd)
                textarea.setSelectionRange(Math.min(anchorPos, targetPos), Math.max(anchorPos, targetPos))
              } else {
                // Move cursor
                textarea.setSelectionRange(targetPos, targetPos)
              }
              return
            }
          } else {
            // Regular right arrow - skip leading spaces if at line end
            if (posInLine === currentLine.length && lineIndex < lines.length - 1 && selectionStart === selectionEnd) {
              const nextLine = lines[lineIndex + 1]
              const nextLeadingSpaces = nextLine.match(/^(\s*)/)?.[1]?.length || 0
              if (nextLeadingSpaces > 0) {
                e.preventDefault()
                const nextLineStart = currentPos + currentLine.length + 1
                const targetPos = nextLineStart + nextLeadingSpaces
                textarea.setSelectionRange(targetPos, targetPos)
                return
              }
            }
          }
        } else if (e.key === 'ArrowUp') {
          // Move to previous line, skip leading spaces
          if (lineIndex > 0) {
            e.preventDefault()
            const prevLine = lines[lineIndex - 1]
            const prevLeadingSpaces = prevLine.match(/^(\s*)/)?.[1]?.length || 0
            let prevLineStart = 0
            for (let i = 0; i < lineIndex - 1; i++) {
              prevLineStart += lines[i].length + 1
            }
            const targetPos = prevLineStart + prevLeadingSpaces
            textarea.setSelectionRange(targetPos, targetPos)
            return
          }
        } else if (e.key === 'ArrowDown') {
          // Move to next line, skip leading spaces
          if (lineIndex < lines.length - 1) {
            e.preventDefault()
            const nextLine = lines[lineIndex + 1]
            const nextLeadingSpaces = nextLine.match(/^(\s*)/)?.[1]?.length || 0
            let nextLineStart = 0
            for (let i = 0; i <= lineIndex; i++) {
              nextLineStart += lines[i].length + 1
            }
            const targetPos = nextLineStart + nextLeadingSpaces
            textarea.setSelectionRange(targetPos, targetPos)
            return
          }
        }
      }
      
      // Handle Tab key for indentation
      if (e.key === 'Tab') {
        e.preventDefault()
        
        if (e.shiftKey) {
          api.decreaseIndent()
        } else {
          api.increaseIndent()
        }
        return
      }
    }
    
    return (
      <div className="editor-pane">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleCursorMovement}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="マインドマップのテキストを入力してください。インデントで階層を表現します。"
          aria-label="マインドマップテキストエディタ"
        />
      </div>
    )
  }
)

EnhancedTextEditor.displayName = 'EnhancedTextEditor'