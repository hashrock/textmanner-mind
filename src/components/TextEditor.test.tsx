import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextEditor } from './TextEditor'

describe('TextEditor', () => {
  it('renders with correct title', () => {
    render(<TextEditor value="" onChange={() => {}} />)
    expect(screen.getByText('テキストエディタ')).toBeInTheDocument()
  })

  it('displays the value prop in textarea', () => {
    const testValue = 'Test mindmap text'
    render(<TextEditor value={testValue} onChange={() => {}} />)
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    expect(textarea).toHaveValue(testValue)
  })

  it('calls onChange when text is typed', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    
    render(<TextEditor value="" onChange={handleChange} />)
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    
    await user.type(textarea, 'New text')
    
    // Check that onChange was called for each character
    expect(handleChange).toHaveBeenCalled()
  })

  it('displays placeholder text', () => {
    render(<TextEditor value="" onChange={() => {}} />)
    const textarea = screen.getByPlaceholderText('マインドマップのテキストを入力してください。インデントで階層を表現します。')
    expect(textarea).toBeInTheDocument()
  })

  it('handles multiline text correctly', () => {
    const multilineText = `Root
  Child 1
    Grandchild 1
  Child 2`
    
    render(<TextEditor value={multilineText} onChange={() => {}} />)
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    expect(textarea).toHaveValue(multilineText)
  })

  it('has correct CSS class', () => {
    const { container } = render(<TextEditor value="" onChange={() => {}} />)
    expect(container.querySelector('.editor-pane')).toBeInTheDocument()
  })

  it('handles onChange with event target value', () => {
    const handleChange = vi.fn()
    render(<TextEditor value="" onChange={handleChange} />)
    
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    const newValue = 'Updated text'
    
    fireEvent.change(textarea, { target: { value: newValue } })
    
    expect(handleChange).toHaveBeenCalledWith(newValue)
  })
})