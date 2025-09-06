import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './App.css'
import { EnhancedTextEditor } from './components/EnhancedTextEditor'
import type { EnhancedTextEditorRef } from './components/EnhancedTextEditor'
import { MindMapKonva } from './components/MindMapKonva'
import { parseTextToNodes } from './utils/mindmapParser'
import type { MindMapNode } from './types/MindMap'
import { useSelectionSync } from './hooks/useSelectionSync'
import { hasMultipleRoots, formatToSingleRoot } from './utils/textFormatter'
import { FileSystemManager } from './utils/fileSystem'
import { FileOperations } from './components/FileOperations'
import { useAutoSave } from './hooks/useAutoSave'

function App() {
  const urlParams = new URLSearchParams(window.location.search)
  const demoMode = urlParams.get('demo') === 'true'
  
  const initialText = demoMode ? `TextManner: Mind
  マインドマップをもっと気軽に
    考えることをもっと楽しく
    アイデアを自由に
  マインドマップは
    放射状に項目を書き出して
    線でつなげて発想を広げます
  TextManner: Mindはマインドマップ作成ツール
    内部的にはテキストエリア
    なので使い方を覚える必要がありません
    保存先もローカルです` : ''
  
  const [text, setText] = useState(initialText)
  const [showWelcome, setShowWelcome] = useState(!demoMode)
  const [currentFileName, setCurrentFileName] = useState<string | undefined>()
  
  const [nodes, setNodes] = useState<MindMapNode[]>([])
  const editorRef = useRef<EnhancedTextEditorRef>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null!)
  const [isFormatting, setIsFormatting] = useState(false)
  
  const fileManager = useMemo(() => new FileSystemManager(), [])
  const { isDirty } = useAutoSave(text, fileManager)

  // Handle text change with auto-formatting
  const handleTextChange = useCallback((newText: string) => {
    setShowWelcome(false)
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

  // Handle file operations
  const handleFileOpen = useCallback((content: string) => {
    setText(content)
    setShowWelcome(false)
    const handle = fileManager.getCurrentFileHandle()
    if (handle) {
      setCurrentFileName(handle.name)
    }
  }, [fileManager])

  const handleNewFile = useCallback(() => {
    setText(`TextManner: Mind
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
    setShowWelcome(false)
    setCurrentFileName(undefined)
  }, [])

  useEffect(() => {
    const newNodes = parseTextToNodes(text)
    setNodes(newNodes)
  }, [text])

  // Get textarea ref after component mounts and when showWelcome changes
  useEffect(() => {
    // Access the textarea through the editor's DOM
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      textareaRef.current = textarea
    }
  }, [showWelcome])

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

  // Handle beforeunload event to prompt for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !fileManager.getCurrentFileHandle() && text.length > 0) {
        e.preventDefault()
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, fileManager, text])

  // Save file handle on unload
  useEffect(() => {
    const handleUnload = () => {
      const handle = fileManager.getCurrentFileHandle()
      if (handle) {
        localStorage.setItem('lastFileHandle', JSON.stringify(handle))
      }
    }

    window.addEventListener('unload', handleUnload)
    return () => window.removeEventListener('unload', handleUnload)
  }, [fileManager])

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
      {showWelcome ? (
        <div className="welcome-screen">
          <h1>TextManner: Mind</h1>
          <p>A minimalist mindmap editor</p>
          <FileOperations
            onFileOpen={handleFileOpen}
            onNewFile={handleNewFile}
            fileManager={fileManager}
            currentFileName={currentFileName}
          />
        </div>
      ) : (
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
            <div className="file-info">
              {currentFileName && (
                <span className="file-name">{currentFileName}</span>
              )}
              {isDirty && !fileManager.getCurrentFileHandle() && (
                <button 
                  className="save-button"
                  onClick={() => fileManager.saveAsFile(text)}
                >
                  Save
                </button>
              )}
            </div>
          </div>
          
          {/* Editor pane - right side */}
          <div className="editor-container">
            <EnhancedTextEditor ref={editorRef} value={text} onChange={handleTextChange} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App