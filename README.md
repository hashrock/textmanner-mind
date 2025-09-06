# TextManner: Mind

マインドマップをもっと気軽に作成できるテキストベースのマインドマップエディタ

## 概要

TextManner: Mindは、テキストエディタの使い勝手とマインドマップの視覚的な表現を組み合わせた、シンプルで直感的なマインドマップ作成ツールです。

### 特徴

- **テキストベース**: インデントでマインドマップの階層構造を表現
- **リアルタイム同期**: テキストの編集が即座にマインドマップビューに反映
- **双方向編集**: マインドマップのノードをクリックするとテキストエディタの該当箇所にジャンプ
- **ローカルファイル対応**: File System Access APIを使用してローカルファイルの読み込み・保存が可能
- **自動保存**: 編集内容をIndexedDBに自動保存
- **キーボードショートカット**: Cmd+S / Ctrl+S でファイル保存

## 使い方

### インストール

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test
```

### テキストフォーマット

インデント（スペース2つ）を使って階層構造を表現します：

```
ルートノード
  子ノード1
    孫ノード1-1
    孫ノード1-2
  子ノード2
    孫ノード2-1
```

### デモモード

URLパラメータ `?demo=true` を追加することで、サンプルテキストが読み込まれたデモモードで起動できます。

## 技術スタック

- **フレームワーク**: React 19 + TypeScript
- **ビルドツール**: Vite
- **マインドマップ描画**: Konva.js / React Konva
- **データ永続化**: IndexedDB (idb)
- **テスト**: Vitest + Testing Library

## プロジェクト構成

```
src/
├── components/
│   ├── EnhancedTextEditor.tsx  # テキストエディタコンポーネント
│   ├── MindMapKonva.tsx        # マインドマップ表示コンポーネント
│   └── FileOperations.tsx      # ファイル操作UI
├── hooks/
│   ├── useSelectionSync.ts     # テキスト選択とマインドマップの同期
│   └── useAutoSave.ts          # 自動保存機能
├── utils/
│   ├── mindmapParser.ts        # テキストからノード構造への変換
│   ├── textFormatter.ts        # テキストフォーマット処理
│   └── fileSystem.ts           # ファイルシステム操作
└── types/
    └── MindMap.ts               # 型定義

```

## ライセンス

MIT
