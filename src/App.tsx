import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { EnhancedTextEditor } from './components/EnhancedTextEditor'
import type { EnhancedTextEditorRef } from './components/EnhancedTextEditor'
import { MindMapKonva } from './components/MindMapKonva'
import { parseTextToNodes } from './utils/mindmapParser'
import type { MindMapNode } from './types/MindMap'
import { useSelectionSync } from './hooks/useSelectionSync'
import { hasMultipleRoots, formatToSingleRoot } from './utils/textFormatter'

function App() {
  const [text, setText] = useState(`TextManner: Mind
  マインドマップをもっと気軽に
    考えることをもっと楽しく
    アイデアを自由に
  マインドマップは
    放射状に項目を書き出して
    線でつなげて発想を広げます
  TextManner: Mindはマインドマップ作成ツール
    内部的にはテキストエリア
    なので使い方を覚える必要がありません
    保存先もローカルです`)
  
  const [nodes, setNodes] = useState<MindMapNode[]>([])
  const editorRef = useRef<EnhancedTextEditorRef>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFormatting, setIsFormatting] = useState(false)

  // Handle text change with auto-formatting
  const handleTextChange = useCallback((newText: string) => {
    // Check if the text has multiple roots
    if (hasMultipleRoots(newText) && !isFormatting) {
      // Format to single root
      setIsFormatting(true)
      const formattedText = formatToSingleRoot(newText)
      setText(formattedText)
      setIsFormatting(false)
      
      // Move cursor to end of first line (the new root)
      setTimeout(() => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement
        if (textarea) {
          const firstLineEnd = formattedText.indexOf('\n')
          textarea.setSelectionRange(firstLineEnd, firstLineEnd)
        }
      }, 0)
    } else {
      setText(newText)
    }
  }, [isFormatting])

  useEffect(() => {
    const newNodes = parseTextToNodes(text)
    setNodes(newNodes)
  }, [text])

  // Get textarea ref after component mounts
  useEffect(() => {
    // Access the textarea through the editor's DOM
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      textareaRef.current = textarea
    }
  }, [])

  const {
    selectionState,
    jumpToNode,
    getCursorPositionInNode,
    getSelectionInNode,
    updateSelection
  } = useSelectionSync(textareaRef, nodes)

  // Handle node click
  const handleNodeClick = useCallback((node: MindMapNode) => {
    jumpToNode(node)
  }, [jumpToNode])

  // Update selection when text changes or cursor moves
  useEffect(() => {
    updateSelection()
  }, [text, updateSelection])
  
  // Also update selection on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      updateSelection()
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [updateSelection])

  return (
    <div className="app-container">
      <div className="two-pane-layout">
        {/* Mindmap pane - left side */}
        <div className="mindmap-container">
          <MindMapKonva 
            nodes={nodes}
            selectionState={selectionState}
            onNodeClick={handleNodeClick}
            getCursorPositionInNode={getCursorPositionInNode}
            getSelectionInNode={getSelectionInNode}
            fullScreen={false}
          />
        </div>
        
        {/* Editor pane - right side */}
        <div className="editor-container">
          <EnhancedTextEditor ref={editorRef} value={text} onChange={handleTextChange} />
        </div>
      </div>
    </div>
  )
}

export default App