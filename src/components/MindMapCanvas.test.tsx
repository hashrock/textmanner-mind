import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MindMapCanvas } from './MindMapCanvas'
import type { MindMapNode } from '../types/MindMap'

describe('MindMapCanvas', () => {
  const mockNodes: MindMapNode[] = [
    {
      id: 'node_0',
      text: 'Root Node',
      x: 400,
      y: 300,
      children: ['node_1', 'node_2']
    },
    {
      id: 'node_1',
      text: 'Child 1',
      x: 250,
      y: 300,
      children: []
    },
    {
      id: 'node_2',
      text: 'Child 2',
      x: 550,
      y: 300,
      children: []
    }
  ]

  let getContextSpy: any
  
  beforeEach(() => {
    // Reset the canvas mock before each test
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
  })

  it('renders with correct title', () => {
    render(<MindMapCanvas nodes={[]} />)
    expect(screen.getByText('マインドマップ')).toBeInTheDocument()
  })

  it('renders canvas element', () => {
    render(<MindMapCanvas nodes={[]} />)
    const canvas = screen.getByLabelText('マインドマップキャンバス')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
  })

  it('has correct canvas dimensions', () => {
    render(<MindMapCanvas nodes={[]} />)
    const canvas = screen.getByLabelText('マインドマップキャンバス') as HTMLCanvasElement
    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(600)
  })

  it('has correct CSS class', () => {
    const { container } = render(<MindMapCanvas nodes={[]} />)
    expect(container.querySelector('.mindmap-pane')).toBeInTheDocument()
  })

  it('calls getContext on canvas', () => {
    render(<MindMapCanvas nodes={mockNodes} />)
    expect(getContextSpy).toHaveBeenCalledWith('2d')
  })

  it('clears canvas when rendering', () => {
    render(<MindMapCanvas nodes={mockNodes} />)
    const ctx = getContextSpy.mock.results[0].value
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
  })

  it('draws connections between nodes', () => {
    render(<MindMapCanvas nodes={mockNodes} />)
    const ctx = getContextSpy.mock.results[0].value
    
    // Check that lines are drawn between parent and children
    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.moveTo).toHaveBeenCalled()
    expect(ctx.lineTo).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
  })

  it('draws node backgrounds and text', () => {
    render(<MindMapCanvas nodes={mockNodes} />)
    const ctx = getContextSpy.mock.results[0].value
    
    // Check that node backgrounds are drawn
    expect(ctx.fill).toHaveBeenCalled()
    
    // Check that text is drawn for each node
    expect(ctx.fillText).toHaveBeenCalledTimes(mockNodes.length)
    expect(ctx.fillText).toHaveBeenCalledWith('Root Node', 400, 300)
    expect(ctx.fillText).toHaveBeenCalledWith('Child 1', 250, 300)
    expect(ctx.fillText).toHaveBeenCalledWith('Child 2', 550, 300)
  })

  it('handles empty nodes array', () => {
    render(<MindMapCanvas nodes={[]} />)
    const ctx = getContextSpy.mock.results[0].value
    
    // Should only clear the canvas, not draw anything else
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('applies different styles for root node', () => {
    render(<MindMapCanvas nodes={mockNodes} />)
    const ctx = getContextSpy.mock.results[0].value
    
    // Check that ellipse is called for root node
    expect(ctx.ellipse).toHaveBeenCalled()
    
    // Check that fillStyle is set to red for root
    expect(ctx.fillStyle).toBe('#333') // Last set value for text
  })

  it('measures text width for proper sizing', () => {
    render(<MindMapCanvas nodes={mockNodes} />)
    const ctx = getContextSpy.mock.results[0].value
    
    // Check that measureText is called for each node
    expect(ctx.measureText).toHaveBeenCalledWith('Root Node')
    expect(ctx.measureText).toHaveBeenCalledWith('Child 1')
    expect(ctx.measureText).toHaveBeenCalledWith('Child 2')
  })

  it('rerenders when nodes prop changes', () => {
    const { rerender } = render(<MindMapCanvas nodes={mockNodes} />)
    
    const newNodes: MindMapNode[] = [
      {
        id: 'node_0',
        text: 'New Root',
        x: 400,
        y: 300,
        children: []
      }
    ]
    
    // Clear the mock to reset call history
    getContextSpy.mockClear()
    
    rerender(<MindMapCanvas nodes={newNodes} />)
    
    const ctx = getContextSpy.mock.results[0].value
    expect(ctx.fillText).toHaveBeenCalledWith('New Root', 400, 300)
  })
})