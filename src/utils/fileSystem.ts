import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'

export interface RecentFile {
  name: string
  handle: FileSystemFileHandle
  lastModified: number
}

interface FileSystemDB extends DBSchema {
  'recent-files': {
    key: string
    value: {
      name: string
      handle: FileSystemFileHandle
      lastModified: number
    }
  }
  'last-file': {
    key: string
    value: FileSystemFileHandle
  }
}

const DB_NAME = 'textmanner-filesystem'
const DB_VERSION = 1
const MAX_RECENT_FILES = 5

export class FileSystemManager {
  private currentFileHandle: FileSystemFileHandle | null = null
  private isDirty = false
  private db: IDBPDatabase<FileSystemDB> | null = null

  constructor() {
    this.initDB()
  }

  private async initDB() {
    try {
      this.db = await openDB<FileSystemDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('recent-files')) {
            db.createObjectStore('recent-files')
          }
          if (!db.objectStoreNames.contains('last-file')) {
            db.createObjectStore('last-file')
          }
        },
      })
    } catch (err) {
      console.error('Failed to initialize IndexedDB:', err)
    }
  }

  private async ensureDB() {
    if (!this.db) {
      await this.initDB()
    }
  }

  async newFile(): Promise<string> {
    this.currentFileHandle = null
    this.isDirty = false
    return ''
  }

  async openFile(): Promise<{ content: string; handle: FileSystemFileHandle } | null> {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Text Files',
            accept: {
              'text/plain': ['.txt', '.md'],
            },
          },
        ],
      })

      const file = await handle.getFile()
      const content = await file.text()
      
      this.currentFileHandle = handle
      this.isDirty = false
      
      await this.addToRecentFiles(handle)
      
      return { content, handle }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return null
      }
      throw err
    }
  }

  async saveFile(content: string): Promise<boolean> {
    if (!this.currentFileHandle) {
      return await this.saveAsFile(content)
    }

    try {
      const writable = await this.currentFileHandle.createWritable()
      await writable.write(content)
      await writable.close()
      
      this.isDirty = false
      await this.addToRecentFiles(this.currentFileHandle)
      return true
    } catch (err) {
      console.error('Failed to save file:', err)
      return false
    }
  }

  async saveAsFile(content: string): Promise<boolean> {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'mindmap.txt',
        types: [
          {
            description: 'Text Files',
            accept: {
              'text/plain': ['.txt', '.md'],
            },
          },
        ],
      })

      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()
      
      this.currentFileHandle = handle
      this.isDirty = false
      
      await this.addToRecentFiles(handle)
      return true
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return false
      }
      throw err
    }
  }

  async openRecentFile(file: RecentFile): Promise<{ content: string; handle: FileSystemFileHandle } | null> {
    try {
      const handle = file.handle
      const permission = await handle.queryPermission?.({ mode: 'read' }) ?? 'prompt'
      
      if (permission === 'granted' || (permission === 'prompt' && await handle.requestPermission?.({ mode: 'read' }) === 'granted')) {
        const fileData = await handle.getFile()
        const content = await fileData.text()
        
        this.currentFileHandle = handle
        this.isDirty = false
        
        await this.addToRecentFiles(handle)
        
        return { content, handle }
      }
      return null
    } catch (err) {
      console.error('Failed to open recent file:', err)
      return null
    }
  }

  private async addToRecentFiles(handle: FileSystemFileHandle): Promise<void> {
    await this.ensureDB()
    if (!this.db) return

    try {
      const file = await handle.getFile()
      const recentFiles = await this.getRecentFiles()
      
      // Remove duplicate if exists
      const filtered = recentFiles.filter(f => f.name !== handle.name)
      
      // Add new file at the beginning
      const newRecent: RecentFile = {
        name: handle.name,
        handle,
        lastModified: file.lastModified,
      }
      
      const updated = [newRecent, ...filtered].slice(0, MAX_RECENT_FILES)
      
      // Clear and update IndexedDB
      const tx = this.db.transaction('recent-files', 'readwrite')
      const store = tx.objectStore('recent-files')
      
      // Clear all existing entries
      const keys = await store.getAllKeys()
      for (const key of keys) {
        await store.delete(key)
      }
      
      // Add updated entries
      for (let i = 0; i < updated.length; i++) {
        await store.put({
          name: updated[i].name,
          handle: updated[i].handle,
          lastModified: updated[i].lastModified,
        }, `file-${i}`)
      }
      
      await tx.done
      
      // Also save as last opened file
      const lastTx = this.db.transaction('last-file', 'readwrite')
      await lastTx.objectStore('last-file').put(handle, 'last')
      await lastTx.done
    } catch (err) {
      console.error('Failed to save recent files:', err)
    }
  }

  async getRecentFiles(): Promise<RecentFile[]> {
    await this.ensureDB()
    if (!this.db) return []

    try {
      const tx = this.db.transaction('recent-files', 'readonly')
      const store = tx.objectStore('recent-files')
      const keys = await store.getAllKeys()
      
      const files: RecentFile[] = []
      for (const key of keys) {
        const file = await store.get(key)
        if (file) {
          files.push({
            name: file.name,
            handle: file.handle,
            lastModified: file.lastModified,
          })
        }
      }
      
      return files
    } catch (err) {
      console.error('Failed to get recent files:', err)
      return []
    }
  }

  async getLastFileHandle(): Promise<FileSystemFileHandle | null> {
    await this.ensureDB()
    if (!this.db) return null

    try {
      const tx = this.db.transaction('last-file', 'readonly')
      const handle = await tx.objectStore('last-file').get('last')
      return handle || null
    } catch (err) {
      console.error('Failed to get last file handle:', err)
      return null
    }
  }

  getCurrentFileHandle(): FileSystemFileHandle | null {
    return this.currentFileHandle
  }

  setDirty(dirty: boolean): void {
    this.isDirty = dirty
  }

  getIsDirty(): boolean {
    return this.isDirty
  }
}