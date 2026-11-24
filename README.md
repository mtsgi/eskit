# ESKit

**ESKit** は、バニラ JavaScript と Web Components で構築されたブラウザネイティブのデスクトップ環境フレームワークです。

> **ドキュメント案内:**
> - **アプリ開発・API リファレンス** → [API.md](API.md)
> - **アーキテクチャ計画・ロードマップ・ADR** → [PLAN.md](PLAN.md)
> - **サードパーティライセンス** → [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)

---

## コンセプト

- **ビルド不要・npm 非依存** — `package.json` やバンドラを使わず、ブラウザネイティブの ES Modules と Import Maps で直接動作します
- **Web API 活用** — Popover API、IndexedDB、Web Crypto API、Service Worker などの標準 Web API を活用します
- **Web Components** — Custom Elements と Shadow DOM、Constructable StyleSheets でカプセル化された UI を構築します
- **ESKit FS** — IndexedDB (`eskit-fs`) 上に実装された仮想ファイルシステム (VFS) を提供します
- **Hamon & kitstrap2** — 軽量シグナル駆動テンプレートエンジン `Hamon`（任意利用）と、Shadow DOM 共有 CSS フレームワーク `kitstrap2` を統合しています
- **PWA 対応** — `manifest.webmanifest` と Service Worker (`sw.js`) によりインストール・オフライン起動に対応します

---

## クイックスタート（ローカル起動）

ESKit は ES Modules・Import Maps・Service Worker を使用するため、`file://` プロトコルでは動作しません。任意の静的 HTTP サーバーで配信して開いてください。

```bash
# 例: Python 標準サーバー
python3 -m http.server 8000

# 例: Node.js (npx) を使う場合
npx serve .
```

ブラウザで `http://localhost:8000` を開くと起動します。  
初回起動時はデフォルトの管理者ユーザー (`admin`) が自動作成され、ログインした状態でデスクトップが開きます。

---

## アーキテクチャ

```
ESKitSystem (window.System)
├── events        : ESKitEventBus             イベントバス (pub/sub)
├── fs            : ESKitFileSystem           仮想ファイルシステム (IndexedDB)
├── registry      : ESKitRegistry             アプリレジストリ (ビルトイン / 外部 URL)
├── permissions   : ESKitPermissions          2 段階権限マネージャー
├── users         : ESKitUsers                ユーザー / ログインセッション管理
├── shellMode     : ESKitShellMode            desktop / mobile モード切替
├── icons         : ESKitIcons                アイコンレジストリ (<eskit-icon>)
├── theme         : ESKitTheme                テーマ・カラーモード・壁紙管理
├── i18n          : ESKitI18n                 多言語辞書・リアクティブ翻訳
├── manifest      : ESKitManifest             define.json バリデーション
├── notifications : ESKitNotificationsStore   通知履歴ストア
├── dialog        : ESKitDialogElement        汎用モーダルダイアログ
└── WindowSystem  : ESKitWindowSystem         ウィンドウ・シェル UI 管理
    ├── eskit-desktop                         デスクトップルート
    ├── eskit-window                          アプリウィンドウ
    ├── eskit-taskbar / eskit-launcher        タスクバー / ランチャー (desktop)
    ├── eskit-home-bar / eskit-drawer         ホームバー / ドロワー (mobile)
    ├── eskit-context-menu                    右クリックコンテキストメニュー
    ├── eskit-beacon                          グローバル検索 (Ctrl/Cmd + Space)
    └── eskit-quick-settings                  クイック設定パネル
```

### 起動シーケンス

```
ESKitSystem.constructor()
  └─ #boot() [async]
       ├─ fs.init() / users.init()            VFS・ユーザーストア初期化
       ├─ #initBaseDirs()                     /home, /shared, /system, /apps 等を作成
       ├─ theme.init() / i18n.init()          テーマ・言語初期化
       ├─ #ensureDefaultAdmin() / #ensureLogin() 初回 admin 作成・ログイン確認
       ├─ #initCurrentUserDirs()              ユーザーホーム & サンプルファイル配置
       ├─ theme.init() / i18n.init()          ユーザー設定の再適用
       ├─ new ESKitWindowSystem()             シェル UI 要素を構築
       ├─ #registerBuiltinApps()              ビルトインアプリを登録
       ├─ registry.loadInstalledApps()        外部インストール済みアプリを復元
       ├─ initUI() / initPWA()                コンテキストメニュー・PWA 監視を開始
       └─ events.emit("system:ready")         起動完了通知 (→ System.ready 解決)
```

### ディレクトリ構成

```
.
├── index.html                 エントリ HTML (Import Map 定義)
├── main.js                    ブートスクリプト (初期アプリ起動)
├── manifest.webmanifest       PWA マニフェスト
├── sw.js                      PWA Service Worker (Network-First)
├── icons/                     PWA アイコン
├── system/                    OS コア・サービス・Web Components
│   ├── system.js / app.js     ESKitSystem / ESKitApp 基底クラス
│   ├── hamon.js               リアクティブテンプレートエンジン
│   ├── filesystem.js / ...    各サブシステム (users, permissions, registry, theme, i18n, icons)
│   ├── kitstrap2.css / .js    共有 CSS フレームワーク
│   ├── i18n/                  システム多言語辞書 (ja.json, en.json)
│   └── elements/              各種 Custom Elements (window, desktop, dialog, file-picker 等)
└── apps/                      組み込みアプリケーション
```

---

## アプリ開発の概要

アプリは `apps/<name>/` ディレクトリ（または HTTPS でホストされた外部ディレクトリ）に配置し、マニフェスト (`define.json`) とエントリポイント (`main.js`) を用意して作成します。

```
apps/myapp/
├── define.json      マニフェスト (必須)
├── main.js          エントリポイント (必須)
├── style.js         CSS スタイル (任意)
└── i18n/            多言語辞書 (任意: ja.json, en.json)
```

### 1. マニフェスト (`define.json`)

```json
{
  "id": "com.example.myapp",
  "name": { "ja": "マイアプリ", "en": "My App" },
  "entry": "main.js",
  "version": "1.0.0",
  "description": "アプリの説明",
  "icon": { "type": "set", "set": "lucide", "name": "sparkles" },
  "permissions": ["fs.read", "notifications"]
}
```

### 2. アプリクラス (`main.js`)

> **ES Modules に関する注意:** `index.html` は `type="module"` で動作するため、`System` はファイル先頭で `const System = globalThis.System;` と宣言するか `globalThis.System` 経由で参照してください。

```js
import ESKitApp from "system/app.js";
import hamon from "system/hamon.js";
import { css } from "system/util.js";

export default class MyApp extends ESKitApp {
  static style = css`
    .wrap { padding: 1rem; display: grid; gap: 0.75rem; }
  `;

  constructor() {
    super();
    const count = this.hamon.signal(0);
    this.template = hamon`
      <div class="wrap">
        <p>Count: ${() => count.value}</p>
        <button class="kit-button -primary" @click=${() => count.value++}>
          カウントアップ
        </button>
      </div>
    `;
  }

  initialize() {
    // ウィンドウ準備完了後に呼ばれる
  }
}
```

静的テンプレートには `system/util.js` の `html` タグ関数も利用できます。`this.fs`・`this.showNotification()`・`this.t()`・`this.onOpenFile()` など全 API の詳細は **[API.md](API.md)** を参照してください。

---

## 組み込みアプリ

| アプリ | ディレクトリ | 説明 | 状態 |
|--------|------------|------|------|
| **SystemVerifier** (`TestApp`) | `apps/test/` | システム API・UI 検証用アプリ | ✅ 実装済み |
| **Welcome** | `apps/welcome/` | ようこそ画面 | ✅ 実装済み |
| **ESKish** | `apps/eskish/` | EcmaScript 風コマンドを備えたターミナル環境 | ✅ 実装済み |
| **Settings** | `apps/settings/` | 外観・言語・通知・プロセス・権限の管理 | ✅ 実装済み |
| **Notepad** | `apps/notepad/` | 仮想 FS / PC ダウンロード対応テキストエディタ | ✅ 実装済み |
| **Calculator** | `apps/calculator/` | 四則演算電卓（キーボード対応） | ✅ 実装済み |
| **Clock** | `apps/clock/` | 世界時計・ストップウォッチ・タイマー | ✅ 実装済み |
| **File Manager** | `apps/filemanager/` | 仮想 FS ブラウザ・ファイル送受信 | ✅ 実装済み |

---

## 開発状況とロードマップ

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 1〜6 | コア基盤・ウィンドウ管理・シェル UI・Hamon・マルチユーザー・ESKish・Icon・システムサービス・PWA・サンプルアプリ | ✅ 実装済み |
| Phase 7〜12 | 棚卸しと ADR・Boot Recovery・Core/AppContext 分離・Scoped Permissions・Intent/Lifecycle・kitstrap2 同期・Browser Native テスト・eskpt/Store 連携 | 📋 計画中 |

各 Phase の詳細仕様・設計判断 (ADR)・課題の優先順位は **[PLAN.md](PLAN.md)** を参照してください。
