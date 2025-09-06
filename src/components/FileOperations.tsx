import { useState, useEffect, useCallback } from 'react'
import { FileSystemManager } from '../utils/fileSystem'
import type { RecentFile } from '../utils/fileSystem'
import './FileOperations.css'

interface FileOperationsProps {
  onFileOpen: (content: string) => void
  onNewFile: () => void
  fileManager: FileSystemManager
  currentFileName?: string
}

export function FileOperations({ onFileOpen, onNewFile, fileManager, currentFileName }: FileOperationsProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])

  const loadRecentFiles = useCallback(async () => {
    const files = await fileManager.getRecentFiles()
    setRecentFiles(files)
  }, [fileManager])

  useEffect(() => {
    loadRecentFiles()
  }, [loadRecentFiles])

  const handleNewFile = async () => {
    await fileManager.newFile()
    onNewFile()
    await loadRecentFiles()
  }

  const handleOpenFile = async () => {
    const result = await fileManager.openFile()
    if (result) {
      onFileOpen(result.content)
      await loadRecentFiles()
    }
  }

  const handleOpenRecent = async (file: RecentFile) => {
    const result = await fileManager.openRecentFile(file)
    if (result) {
      onFileOpen(result.content)
      await loadRecentFiles()
    }
  }

  return (
    <div className="file-operations">
      <div className="file-actions">
        <button onClick={handleNewFile} className="file-button new-file">
          New
        </button>
        <button onClick={handleOpenFile} className="file-button open-file">
          Open
        </button>
      </div>
      
      {currentFileName && (
        <div className="current-file">
          <span className="current-file-label">Current file:</span>
          <span className="current-file-name">{currentFileName}</span>
        </div>
      )}

      {recentFiles.length > 0 && (
        <div className="recent-files">
          <h3>Recent Files</h3>
          <ul className="recent-files-list">
            {recentFiles.map((file, index) => (
              <li key={index}>
                <button
                  onClick={() => handleOpenRecent(file)}
                  className="recent-file-button"
                  title={file.name}
                >
                  <span className="file-name">{file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}