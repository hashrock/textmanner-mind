import React from 'react'

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
}

export const TextEditor: React.FC<TextEditorProps> = ({ value, onChange }) => {
  return (
    <div className="editor-pane">
      <h2>テキストエディタ</h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="マインドマップのテキストを入力してください。インデントで階層を表現します。"
        aria-label="マインドマップテキストエディタ"
      />
    </div>
  )
}