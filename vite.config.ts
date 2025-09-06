import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = mode === 'production' 
    ? '/textmanner-mind/' // リポジトリ名に合わせて変更してください
    : '/'
    
  return {
    plugins: [react()],
    base,
  }
})
