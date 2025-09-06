import { describe, it, expect } from 'vitest'
import { parseTextToNodes, findNodeAtPosition, findNodeAtLine } from './mindmapParser'

describe('mindmapParser', () => {
  describe('parseTextToNodes with position tracking', () => {
    it('tracks line numbers correctly', () => {
      const text = `Root
  Child 1
  Child 2`
      
      const nodes = parseTextToNodes(text)
      
      expect(nodes[0].lineNumber).toBe(0)
      expect(nodes[1].lineNumber).toBe(1)
      expect(nodes[2].lineNumber).toBe(2)
    })

    it('tracks start and end positions', () => {
      const text = `Root
  Child`
      
      const nodes = parseTextToNodes(text)
      
      expect(nodes[0].startPos).toBe(0)
      expect(nodes[0].endPos).toBe(4) // "Root"
      expect(nodes[1].startPos).toBe(5) // After newline
      expect(nodes[1].endPos).toBe(12) // "  Child"
    })

    it('handles empty lines correctly', () => {
      const text = `Root

  Child`
      
      const nodes = parseTextToNodes(text)
      
      expect(nodes).toHaveLength(3) // Now includes empty line
      expect(nodes[1].text).toBe('') // Empty line
      expect(nodes[2].lineNumber).toBe(2)
    })
  })

  describe('findNodeAtPosition', () => {
    it('finds correct node at given position', () => {
      const text = `Root
  Child 1
  Child 2`
      
      const nodes = parseTextToNodes(text)
      
      const node1 = findNodeAtPosition(nodes, 0)
      expect(node1?.text).toBe('Root')
      
      const node2 = findNodeAtPosition(nodes, 7)
      expect(node2?.text).toBe('Child 1')
      
      const node3 = findNodeAtPosition(nodes, 18)
      expect(node3?.text).toBe('Child 2')
    })

    it('returns null for position outside any node', () => {
      const text = `Root`
      const nodes = parseTextToNodes(text)
      
      const node = findNodeAtPosition(nodes, 100)
      expect(node).toBe(null)
    })
  })

  describe('findNodeAtLine', () => {
    it('finds correct node at given line number', () => {
      const text = `Root
  Child 1
  Child 2`
      
      const nodes = parseTextToNodes(text)
      
      const node1 = findNodeAtLine(nodes, 0)
      expect(node1?.text).toBe('Root')
      
      const node2 = findNodeAtLine(nodes, 1)
      expect(node2?.text).toBe('Child 1')
      
      const node3 = findNodeAtLine(nodes, 2)
      expect(node3?.text).toBe('Child 2')
    })

    it('returns null for non-existent line number', () => {
      const text = `Root`
      const nodes = parseTextToNodes(text)
      
      const node = findNodeAtLine(nodes, 10)
      expect(node).toBe(null)
    })
  })

  describe('parseTextToNodes', () => {
    it('parses single line text to single node', () => {
      const text = 'Root Node'
      const nodes = parseTextToNodes(text)
      
      expect(nodes).toHaveLength(1)
      expect(nodes[0].text).toBe('Root Node')
      expect(nodes[0].children).toEqual([])
    })

    it('parses indented text to hierarchical nodes', () => {
      const text = `Root
  Child 1
  Child 2`
      
      const nodes = parseTextToNodes(text)
      
      expect(nodes).toHaveLength(3)
      expect(nodes[0].text).toBe('Root')
      expect(nodes[0].children).toHaveLength(2)
      expect(nodes[1].text).toBe('Child 1')
      expect(nodes[2].text).toBe('Child 2')
    })

    it('handles nested hierarchy correctly', () => {
      const text = `Root
  Child 1
    Grandchild 1
    Grandchild 2
  Child 2
    Grandchild 3`
      
      const nodes = parseTextToNodes(text)
      
      expect(nodes).toHaveLength(6)
      expect(nodes[0].children).toHaveLength(2) // Root has 2 children
      expect(nodes[1].children).toHaveLength(2) // Child 1 has 2 grandchildren
      expect(nodes[4].children).toHaveLength(1) // Child 2 has 1 grandchild
    })

    it('includes empty lines as nodes', () => {
      const text = `Root

  Child 1

    Grandchild 1`
      
      const nodes = parseTextToNodes(text)
      
      expect(nodes).toHaveLength(5) // Now includes empty lines
      expect(nodes[0].text).toBe('Root')
      expect(nodes[1].text).toBe('') // Empty line
      expect(nodes[2].text).toBe('Child 1')
      expect(nodes[3].text).toBe('') // Empty line
      expect(nodes[4].text).toBe('Grandchild 1')
    })

    it('handles tabs and spaces for indentation', () => {
      const text = `Root
\tChild 1
\t\tGrandchild 1
\tChild 2`
      
      const nodes = parseTextToNodes(text)
      
      expect(nodes).toHaveLength(4)
      expect(nodes[0].children).toHaveLength(2)
      expect(nodes[1].children).toHaveLength(1) // Child 1 has 1 grandchild
    })

    it('assigns unique IDs to each node', () => {
      const text = `Root
  Child 1
  Child 2`
      
      const nodes = parseTextToNodes(text)
      const ids = nodes.map(n => n.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('trims whitespace from node text', () => {
      const text = `  Root  
    Child 1  
      Grandchild 1  `
      
      const nodes = parseTextToNodes(text)
      
      expect(nodes[0].text).toBe('Root')
      expect(nodes[1].text).toBe('Child 1')
      expect(nodes[2].text).toBe('Grandchild 1')
    })

    it('handles complex Japanese text', () => {
      const text = `マインドマップ
  思考の整理
    アイデア出し
    問題解決
  視覚化
    関係性の把握
    全体像の理解`
      
      const nodes = parseTextToNodes(text)
      
      expect(nodes).toHaveLength(7)
      expect(nodes[0].text).toBe('マインドマップ')
      expect(nodes[1].text).toBe('思考の整理')
      expect(nodes[5].text).toBe('関係性の把握')
    })

    it('returns single empty node for empty text', () => {
      const nodes = parseTextToNodes('')
      expect(nodes).toHaveLength(1)
      expect(nodes[0].text).toBe('')
    })

    it('returns empty nodes for whitespace-only text', () => {
      const nodes = parseTextToNodes('   \n  \n\t')
      expect(nodes).toHaveLength(3) // Three lines of whitespace
      nodes.forEach(node => {
        expect(node.text).toBe('')
      })
    })

    it('sets initial x and y coordinates with new layout', () => {
      const text = 'Root Node'
      const nodes = parseTextToNodes(text)
      
      // With new left-to-right layout, root starts at left
      expect(nodes[0].x).toBe(100) // startX in treeLayout
      expect(nodes[0].y).toBe(300) // startY in treeLayout
    })
  })

  // layoutNodes tests removed - using new treeLayout module instead
})