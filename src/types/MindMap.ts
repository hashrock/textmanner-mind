export interface MindMapNode {
  id: string
  text: string
  x: number
  y: number
  children: string[]
  lineNumber: number      // Line number in text editor (0-based)
  startPos: number        // Start position in full text (after trimming)
  endPos: number          // End position in full text (after trimming)
  lineStartPos?: number   // Start position of the full line (including leading spaces)
  lineEndPos?: number     // End position of the full line (including trailing spaces)
}

export interface SelectionState {
  cursorPos: number
  selectionStart: number
  selectionEnd: number
  activeNodeId: string | null
}