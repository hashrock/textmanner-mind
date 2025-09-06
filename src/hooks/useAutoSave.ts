import { useEffect, useRef } from 'react'
import { FileSystemManager } from '../utils/fileSystem'

export function useAutoSave(
  content: string,
  fileManager: FileSystemManager,
  delay: number = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContent = useRef<string>(content)

  useEffect(() => {
    if (content === lastSavedContent.current) {
      return
    }

    fileManager.setDirty(true)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      if (fileManager.getCurrentFileHandle()) {
        const success = await fileManager.saveFile(content)
        if (success) {
          lastSavedContent.current = content
          fileManager.setDirty(false)
        }
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, fileManager, delay])

  return {
    isDirty: fileManager.getIsDirty(),
  }
}