interface FileSystemFileHandle {
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
  queryPermission?(options?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
  requestPermission?(options?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
  name: string
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | ArrayBuffer | ArrayBufferView | Blob): Promise<void>
  close(): Promise<void>
}

interface Window {
  showOpenFilePicker(options?: {
    types?: Array<{
      description?: string
      accept?: Record<string, string[]>
    }>
    multiple?: boolean
  }): Promise<FileSystemFileHandle[]>
  
  showSaveFilePicker(options?: {
    suggestedName?: string
    types?: Array<{
      description?: string
      accept?: Record<string, string[]>
    }>
  }): Promise<FileSystemFileHandle>
}