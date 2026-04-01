# ESKit

**ESKit** は、バニラ JavaScript と Web Components で構築されたウェブベースのデスクトップ環境フレームワークです。

## コンセプト

- **ビルド不要** — ビルドツールを一切使用しません。ブラウザネイティブの ES Modules をそのまま活用します
- **npm 非依存** — `package.json` も `node_modules` も存在しません。静的ファイルを配信するだけで動作します
- **Web API 活用** — Popover API、View Transitions API、CSS Anchor Positioning など、最新の Web API を積極的に採用します
- **Web Components** — Custom Elements と Shadow DOM を活用し、再利用可能な UI 部品を構築します
- **ESKit FS** — OS のファイルシステムを IndexedDB 上に実装します
- **kitstrap2** — CSS フレームワークを OS 全体に統合。2 層アーキテクチャ (グローバル `<link>` + Shadow DOM `adoptedStyleSheets` Singleton) でダークモード・テーマを自動反映します

## アーキテクチャ

```
ESKitSystem (window.System)
├── events      : ESKitEventBus        イベントバス (pub/sub)
├── fs          : ESKitFileSystem      仮想ファイルシステム (IndexedDB)
├── registry    : ESKitRegistry        アプリレジストリ
├── permissions : ESKitPermissions     権限マネージャー
└── WindowSystem: ESKitWindowSystem    ウィンドウ管理
    ├── eskit-desktop                  デスクトップ要素
    ├── eskit-window                   ウィンドウ要素
    ├── eskit-taskbar                  タスクバー
    ├── eskit-launcher                 アプリランチャー
    ├── eskit-context-menu             右クリックコンテキストメニュー
    ├── eskit-beacon                   グローバル検索オーバーレイ
    └── eskit-quick-settings           クイック設定パネル
```

### 起動シーケンス

```
ESKitSystem.constructor()
  └─ #boot() [async]
       ├─ fs.init()              IndexedDB を開く
       ├─ #initDefaultDirs()     /home/user 等を作成
       ├─ new ESKitWindowSystem  UI 要素を登録
       ├─ #registerBuiltinApps() ビルトインアプリを登録
       ├─ initUI()               シェル UI を構築
       └─ events.emit("system:ready")
```

## アプリ開発について

ESKit アプリは、`apps/` ディレクトリ以下に配置されたサブディレクトリごとに定義されます。

各アプリは、マニフェスト (`define.json`) とエントリポイント (`main.js`) を必須とし、必要に応じてテンプレートやスタイルを追加できます。

### 1. ディレクトリ構造

```
apps/
└── myapp/
    ├── define.json      マニフェスト (必須)
    ├── main.js          エントリポイント (必須)
    ├── template.js      HTML テンプレート
    └── style.js         スタイル
```

### 2. マニフェスト (`define.json`)

```json
{
  "id": "com.example.myapp",
  "name": "My App",
  "entry": "main.js",
  "version": "1.0.0",
  "description": "アプリの説明",
  "permissions": ["fs.read", "notifications"]
}
```

利用可能な権限・フィールドの詳細は [API.md](API.md) を参照してください。

### 3. アプリクラス (`main.js`)

> **ES Modules に関する注意:** `index.html` は `type="module"` で動作するため、モジュール内では
> `System` 識別子は自動的に解決されません。`window.System` / `globalThis.System` を直接参照するか、
> ファイル先頭で `const System = globalThis.System;` を宣言してください。

```js
import ESKitApp from "system/app.js";
import template from "./template.js";
import style from "./style.js";

const System = globalThis.System;  // ES モジュール内では必須

export default class MyApp extends ESKitApp {
  static template = template;
  static style = style;

  initialize() {
    // アプリ起動時に呼ばれる (_uuid, _windowElement がセット済み)
    this.setTitle("My App");
    const btn = this.querySelector("button");
    btn.addEventListener("click", async () => {
      await this.showNotification({ title: "Hello!", message: "クリックされました" });
    });
  }

  close() {
    // アプリ終了時のクリーンアップ (タイマー解除など)
  }

  onFocus()               { /* ウィンドウがフォーカスされた */ }
  onBlur()                { /* フォーカスが外れた */ }
  onResize(width, height) { /* リサイズされた */ }
  onMinimize()            { /* 最小化された */ }
  onRestore()             { /* 復元された */ }
  onMessage(data)         { /* 別アプリからの IPC メッセージ */ }
}
```

### 4. テンプレート / スタイル

```js
// template.js
import { html } from "system/util.js";
const label = "Click me";
export default html`<button>${label}</button><p class="output"></p>`;

// style.js
import { css } from "system/util.js";
export default css`
  button { background: var(--eskit-color-primary); color: #fff; padding: 0.5rem 1rem; }
`;
```

## APIリファレンス

詳細な API ドキュメントは **[API.md](API.md)** を参照してください。

`System`, `System.fs`, `System.events`, `System.registry`, `System.permissions`, `ESKitApp` の全 API・権限モデル・外部アプリインストールを網羅しています。

## 組み込みアプリ

| アプリ | ディレクトリ | 説明 | 状態 |
|--------|------------|------|------|
| TestApp | `apps/test/` | 開発用テスト | ✅ |
| WelcomeApp | `apps/welcome/` | ようこそ画面 | ✅ |
| Settings | `apps/settings/` | テーマ・言語・権限管理 | Phase 4 |
| Notepad | `apps/notepad/` | テキストエディタ (仮想 FS 対応) | Phase 5 |
| Calculator | `apps/calculator/` | 電卓 | Phase 5 |
| Clock | `apps/clock/` | 時計 / ストップウォッチ / タイマー | Phase 5 |
| File Manager | `apps/filemanager/` | 仮想 FS ブラウザ | Phase 5 |

## ロードマップ

| Phase | 内容 | 状態 |
|-------|------|------|
| 1 | コア基盤 (EventBus / IndexedDB VFS / 権限モデル / Registry) | ✅ 実装済み |
| 2 | ウィンドウ管理 (ドラッグ / リサイズ / スナップ / Z-order) | ✅ 実装済み |
| 3 | デスクトップシェル (コンテキストメニュー / グローバル検索 / クイック設定) | ✅ 実装済み |
| 3.5 | Hamon リアクティブテンプレートエンジン | ✅ 実装済み |
| 4 | システムサービス (通知 / テーマ / i18n / 設定アプリ) | 予定 |
| 5 | 開発者体験 (サンプルアプリ / 外部インストール) | 予定 |
