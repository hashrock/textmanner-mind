import { describe, it, expect } from 'vitest'
import { calculateNodeSizes, assignNodePositions, layoutMindMap } from './treeLayout'
import type { MindMapNode } from '../types/MindMap'

describe('treeLayout', () => {
  describe('calculateNodeSizes', () => {
    it('calculates basic node dimensions', () => {
      const nodes: MindMapNode[] = [
        {
          id: 'node_0',
          text: 'Root',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 0,
          startPos: 0,
          endPos: 4
        }
      ]
      const nodeMap = { 'node_0': nodes[0] }
      
      const layoutMap = calculateNodeSizes(nodes, nodeMap)
      const rootLayout = layoutMap.get('node_0')
      
      expect(rootLayout).toBeDefined()
      expect(rootLayout?.width).toBeGreaterThanOrEqual(100) // MIN_WIDTH
      expect(rootLayout?.height).toBe(40) // NODE_HEIGHT
      expect(rootLayout?.subtreeHeight).toBe(40)
    })
    
    it('calculates subtree heights for nested nodes', () => {
      const nodes: MindMapNode[] = [
        {
          id: 'node_0',
          text: 'Root',
          x: 0,
          y: 0,
          children: ['node_1', 'node_2'],
          lineNumber: 0,
          startPos: 0,
          endPos: 4
        },
        {
          id: 'node_1',
          text: 'Child 1',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 1,
          startPos: 5,
          endPos: 12
        },
        {
          id: 'node_2',
          text: 'Child 2',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 2,
          startPos: 13,
          endPos: 20
        }
      ]
      const nodeMap = {
        'node_0': nodes[0],
        'node_1': nodes[1],
        'node_2': nodes[2]
      }
      
      const layoutMap = calculateNodeSizes(nodes, nodeMap)
      const rootLayout = layoutMap.get('node_0')
      
      expect(rootLayout?.subtreeHeight).toBe(40 + 10 + 40) // Two children + gap
    })
    
    it('handles empty nodes with placeholder width', () => {
      const nodes: MindMapNode[] = [
        {
          id: 'node_0',
          text: '',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 0,
          startPos: 0,
          endPos: 0
        }
      ]
      const nodeMap = { 'node_0': nodes[0] }
      
      const layoutMap = calculateNodeSizes(nodes, nodeMap)
      const emptyLayout = layoutMap.get('node_0')
      
      expect(emptyLayout?.width).toBe(60) // Should use placeholder width for empty nodes
    })
  })
  
  describe('assignNodePositions', () => {
    it('positions root at starting position', () => {
      const nodes: MindMapNode[] = [
        {
          id: 'node_0',
          text: 'Root',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 0,
          startPos: 0,
          endPos: 4
        }
      ]
      const nodeMap = { 'node_0': nodes[0] }
      const layoutMap = calculateNodeSizes(nodes, nodeMap)
      
      assignNodePositions(nodes, nodeMap, layoutMap, 100, 300)
      
      expect(nodes[0].x).toBe(100)
      expect(nodes[0].y).toBe(300)
    })
    
    it('positions children to the right of parent', () => {
      const nodes: MindMapNode[] = [
        {
          id: 'node_0',
          text: 'Root',
          x: 0,
          y: 0,
          children: ['node_1'],
          lineNumber: 0,
          startPos: 0,
          endPos: 4
        },
        {
          id: 'node_1',
          text: 'Child',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 1,
          startPos: 5,
          endPos: 10
        }
      ]
      const nodeMap = {
        'node_0': nodes[0],
        'node_1': nodes[1]
      }
      const layoutMap = calculateNodeSizes(nodes, nodeMap)
      
      assignNodePositions(nodes, nodeMap, layoutMap, 100, 300)
      
      const rootLayout = layoutMap.get('node_0')
      const childLayout = layoutMap.get('node_1')
      
      // Child should be to the right of parent
      expect(nodes[1].x).toBeGreaterThan(nodes[0].x)
      expect(nodes[1].x).toBe(100 + (rootLayout?.width || 0) + 120) // parent.x + parent.width + HORIZONTAL_GAP
    })
    
    it('vertically centers children around parent', () => {
      const nodes: MindMapNode[] = [
        {
          id: 'node_0',
          text: 'Root',
          x: 0,
          y: 0,
          children: ['node_1', 'node_2'],
          lineNumber: 0,
          startPos: 0,
          endPos: 4
        },
        {
          id: 'node_1',
          text: 'Child 1',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 1,
          startPos: 5,
          endPos: 12
        },
        {
          id: 'node_2',
          text: 'Child 2',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 2,
          startPos: 13,
          endPos: 20
        }
      ]
      const nodeMap = {
        'node_0': nodes[0],
        'node_1': nodes[1],
        'node_2': nodes[2]
      }
      const layoutMap = calculateNodeSizes(nodes, nodeMap)
      
      assignNodePositions(nodes, nodeMap, layoutMap, 100, 300)
      
      // Children should be above and below parent
      expect(nodes[1].y).toBeLessThan(nodes[0].y) // First child above
      expect(nodes[2].y).toBeGreaterThan(nodes[0].y) // Second child below
      
      // Check vertical spacing
      const child1Y = nodes[1].y
      const child2Y = nodes[2].y
      expect(child2Y - child1Y).toBe(40 + 10) // NODE_HEIGHT + VERTICAL_GAP
    })
  })
  
  describe('layoutMindMap', () => {
    it('performs complete layout of a simple tree', () => {
      const nodes: MindMapNode[] = [
        {
          id: 'node_0',
          text: 'Root',
          x: 0,
          y: 0,
          children: ['node_1', 'node_2'],
          lineNumber: 0,
          startPos: 0,
          endPos: 4
        },
        {
          id: 'node_1',
          text: 'Child 1',
          x: 0,
          y: 0,
          children: ['node_3'],
          lineNumber: 1,
          startPos: 5,
          endPos: 12
        },
        {
          id: 'node_2',
          text: 'Child 2',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 2,
          startPos: 13,
          endPos: 20
        },
        {
          id: 'node_3',
          text: 'Grandchild',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 3,
          startPos: 21,
          endPos: 31
        }
      ]
      const nodeMap = {
        'node_0': nodes[0],
        'node_1': nodes[1],
        'node_2': nodes[2],
        'node_3': nodes[3]
      }
      
      const layoutMap = layoutMindMap(nodes, nodeMap)
      
      // Check all nodes have positions
      nodes.forEach(node => {
        expect(node.x).toBeGreaterThan(0)
        expect(node.y).toBeGreaterThan(0)
      })
      
      // Check hierarchy (left to right)
      expect(nodes[1].x).toBeGreaterThan(nodes[0].x) // Child 1 right of root
      expect(nodes[2].x).toBeGreaterThan(nodes[0].x) // Child 2 right of root
      expect(nodes[3].x).toBeGreaterThan(nodes[1].x) // Grandchild right of Child 1
      
      // Check that children at same level have same x
      expect(nodes[1].x).toBe(nodes[2].x)
    })
    
    it('handles complex nested structures without overlap', () => {
      const nodes: MindMapNode[] = [
        {
          id: 'root',
          text: 'Root',
          x: 0,
          y: 0,
          children: ['a', 'b'],
          lineNumber: 0,
          startPos: 0,
          endPos: 4
        },
        {
          id: 'a',
          text: 'Branch A',
          x: 0,
          y: 0,
          children: ['a1', 'a2', 'a3'],
          lineNumber: 1,
          startPos: 5,
          endPos: 13
        },
        {
          id: 'b',
          text: 'Branch B',
          x: 0,
          y: 0,
          children: ['b1'],
          lineNumber: 2,
          startPos: 14,
          endPos: 22
        },
        {
          id: 'a1',
          text: 'Leaf A1',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 3,
          startPos: 23,
          endPos: 30
        },
        {
          id: 'a2',
          text: 'Leaf A2',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 4,
          startPos: 31,
          endPos: 38
        },
        {
          id: 'a3',
          text: 'Leaf A3',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 5,
          startPos: 39,
          endPos: 46
        },
        {
          id: 'b1',
          text: 'Leaf B1',
          x: 0,
          y: 0,
          children: [],
          lineNumber: 6,
          startPos: 47,
          endPos: 54
        }
      ]
      
      const nodeMap: { [key: string]: MindMapNode } = {}
      nodes.forEach(n => { nodeMap[n.id] = n })
      
      layoutMindMap(nodes, nodeMap)
      
      // Check no vertical overlap between branches
      const branchA = nodes.find(n => n.id === 'a')!
      const branchB = nodes.find(n => n.id === 'b')!
      const leafA3 = nodes.find(n => n.id === 'a3')!
      const leafB1 = nodes.find(n => n.id === 'b1')!
      
      // Branch B should be below all of Branch A's children
      expect(leafB1.y).toBeGreaterThan(leafA3.y)
      
      // Branches should have proper spacing
      const minSpacing = 10 // VERTICAL_GAP
      expect(leafB1.y - leafA3.y).toBeGreaterThanOrEqual(40) // At least NODE_HEIGHT apart
    })
  })
})