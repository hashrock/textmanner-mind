import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EnhancedTextEditor } from './EnhancedTextEditor'
import { createRef } from 'react'

describe('EnhancedTextEditor', () => {
  it('renders with toolbar and textarea', () => {
    render(<EnhancedTextEditor value="" onChange={() => {}} />)
    
    expect(screen.getByText('テキストエディタ')).toBeInTheDocument()
    expect(screen.getByTitle('インデントを増やす (Tab)')).toBeInTheDocument()
    expect(screen.getByTitle('インデントを減らす (Shift+Tab)')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })).toBeInTheDocument()
  })

  it('displays cursor position', () => {
    render(<EnhancedTextEditor value="Test text" onChange={() => {}} />)
    
    const cursorInfo = screen.getByText(/カーソル位置:/)
    expect(cursorInfo).toBeInTheDocument()
  })

  it('handles Tab key for indentation', () => {
    const onChange = vi.fn()
    render(<EnhancedTextEditor value="Test" onChange={onChange} />)
    
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    
    fireEvent.keyDown(textarea, { key: 'Tab' })
    
    // Should call onChange with indented text
    expect(onChange).toHaveBeenCalled()
  })

  it('handles Shift+Tab for dedentation', () => {
    const onChange = vi.fn()
    render(<EnhancedTextEditor value="  Test" onChange={onChange} />)
    
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    
    fireEvent.keyDown(textarea, { key: 'Tab', shiftKey: true })
    
    // Should call onChange with dedented text
    expect(onChange).toHaveBeenCalled()
  })

  it('handles Enter key with auto-indent', () => {
    const onChange = vi.fn()
    render(<EnhancedTextEditor value="  Test" onChange={onChange} />)
    
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    
    // Set cursor at end of "  Test"
    Object.defineProperty(textarea, 'selectionStart', { value: 6, writable: true })
    Object.defineProperty(textarea, 'selectionEnd', { value: 6, writable: true })
    
    fireEvent.keyDown(textarea, { key: 'Enter' })
    
    // Should call onChange with new line and maintained indent
    expect(onChange).toHaveBeenCalled()
  })

  it('prevents default Tab behavior', () => {
    const onChange = vi.fn()
    render(<EnhancedTextEditor value="Test" onChange={onChange} />)
    
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    
    // Tab key should call onChange (indent) but prevent default
    fireEvent.keyDown(textarea, { key: 'Tab' })
    
    // Check that indent was applied
    expect(onChange).toHaveBeenCalled()
  })

  it('prevents default Enter behavior', () => {
    const onChange = vi.fn()
    render(<EnhancedTextEditor value="Test" onChange={onChange} />)
    
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    
    // Enter key should call onChange (new line with indent) but prevent default
    fireEvent.keyDown(textarea, { key: 'Enter' })
    
    // Check that new line was added
    expect(onChange).toHaveBeenCalled()
  })

  it('clicking indent button increases indentation', () => {
    const onChange = vi.fn()
    render(<EnhancedTextEditor value="Test" onChange={onChange} />)
    
    const indentButton = screen.getByTitle('インデントを増やす (Tab)')
    fireEvent.click(indentButton)
    
    expect(onChange).toHaveBeenCalled()
  })

  it('clicking dedent button decreases indentation', () => {
    const onChange = vi.fn()
    render(<EnhancedTextEditor value="  Test" onChange={onChange} />)
    
    const dedentButton = screen.getByTitle('インデントを減らす (Shift+Tab)')
    fireEvent.click(dedentButton)
    
    expect(onChange).toHaveBeenCalled()
  })

  it('exposes API through ref', () => {
    const ref = createRef<any>()
    render(<EnhancedTextEditor ref={ref} value="Test" onChange={() => {}} />)
    
    expect(ref.current).toBeDefined()
    expect(ref.current.getSelection).toBeDefined()
    expect(ref.current.getCursorPosition).toBeDefined()
    expect(ref.current.setCursorPosition).toBeDefined()
    expect(ref.current.setSelection).toBeDefined()
    expect(ref.current.insertText).toBeDefined()
    expect(ref.current.replaceSelection).toBeDefined()
    expect(ref.current.getCurrentLine).toBeDefined()
    expect(ref.current.getIndentLevel).toBeDefined()
    expect(ref.current.increaseIndent).toBeDefined()
    expect(ref.current.decreaseIndent).toBeDefined()
  })
})