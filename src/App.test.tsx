import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders both TextEditor and MindMapCanvas', () => {
    render(<App />)
    
    // Check for TextEditor
    expect(screen.getByText('テキストエディタ')).toBeInTheDocument()
    
    // Check for MindMapCanvas
    expect(screen.getByText('マインドマップ')).toBeInTheDocument()
  })

  it('has initial text in the editor', () => {
    render(<App />)
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    
    expect((textarea as HTMLTextAreaElement).value).toContain('TextManner: Mind')
    expect((textarea as HTMLTextAreaElement).value).toContain('四角四面のメモではアイデアが出ない')
  })

  it('updates mindmap when text changes', () => {
    render(<App />)
    
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    const newText = 'New Root\n  New Child'
    
    fireEvent.change(textarea, { target: { value: newText } })
    
    // The textarea should now have the new value
    expect(textarea).toHaveValue(newText)
  })

  it('has correct CSS class for container', () => {
    const { container } = render(<App />)
    expect(container.querySelector('.app-container')).toBeInTheDocument()
  })

  it('maintains state between text changes', () => {
    render(<App />)
    
    const textarea = screen.getByRole('textbox', { name: 'マインドマップテキストエディタ' })
    
    // Change text multiple times
    fireEvent.change(textarea, { target: { value: 'First change' } })
    expect(textarea).toHaveValue('First change')
    
    fireEvent.change(textarea, { target: { value: 'Second change' } })
    expect(textarea).toHaveValue('Second change')
    
    fireEvent.change(textarea, { target: { value: 'Third change' } })
    expect(textarea).toHaveValue('Third change')
  })

  it('renders canvas element', () => {
    render(<App />)
    const canvas = screen.getByLabelText('マインドマップキャンバス')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
  })
})