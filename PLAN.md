# ESKit 開発計画

> ESKit — Vanilla JavaScript + Web Components で構築されたウェブベースのデスクトップ環境フレームワーク

## コンセプト・決定事項

- **ビルド不要・npm 非依存** — ブラウザネイティブ ES Modules のみ
- **技術スタック:** Vanilla JS + Web Components (Custom Elements v1, Shadow DOM, Constructable StyleSheets)
- **ブラウザ対象:** Evergreen 最新版のみ。最新 Web API を積極採用:
  - Popover API, View Transitions API, CSS Anchor Positioning, `@starting-style`
  - CSS Container Queries, Shadow DOM v2, `ElementInternals` (Custom State Set)
  - `scheduler.postTask()`, `crypto.randomUUID()`, `Compression Streams` 等
- **永続化:** 設定・テーマ → `localStorage` / ファイル → IndexedDB (ESKitFileSystem)
  - IndexedDB スキーマは開発中につき破壊的変更を許可: バージョンは **1 固定** で管理
- **権限モデル:** 2 段階 (Install-time 宣言 + Runtime ユーザー確認)
- **ドキュメント:** 日本語で記述。API リファレンスは `API.md` に分離
- **テスト/Lint:** オミット (ビルド不要コンセプト優先)

---

## 現状 (Phase 1 実装済み)

| ファイル | 実装内容 |
|----------|---------|
| `system/util.js` | `css` / `html` タグ関数 (補間対応) |
| `system/event-bus.js` | ESKitEventBus — pub/sub |
| `system/filesystem.js` | ESKitFileSystem — IndexedDB VFS (Uint8Array, バイナリ対応) |
| `system/manifest.js` | ESKitManifest — `define.json` を fetch・バリデーション |
| `system/permissions.js` | ESKitPermissions — 2 段階権限管理 + ダイアログ |
| `system/registry.js` | ESKitRegistry — アプリ登録・検索 |
| `system/shell-mode.js` | ESKitShellMode — desktop/mobile モード管理 |
| `system/app.js` | ESKitApp — ライフサイクルフック・開発者 API |
| `system/system.js` | ESKitSystem — カーネル (boot, loadApp, IPC, notify) |
| `system/window.js` | ESKitWindowSystem — モード対応ウィンドウ管理 |
| `system/elements/desktop/` | `eskit-desktop` — デスクトップルート要素 |
| `system/elements/window/` | `eskit-window` — アプリウィンドウ (desktop/mobile 対応) |
| `system/elements/launcher/` | `eskit-launcher` — デスクトップモード用 dev ランチャー |
| `system/elements/drawer/` | `eskit-drawer` — モバイル用アプリドロワー |
| `system/elements/home-bar/` | `eskit-home-bar` — モバイル用ホームバー |
| `system/elements/permission-dialog/` | `eskit-permission-dialog` — 権限確認ダイアログ (Web Component) |
| `apps/test/` | SystemVerifier — システム検証アプリ |
| `apps/welcome/` | WelcomeApp — ようこそ画面 |
| `README.md` | 日本語 README |
| `API.md` | API リファレンス (README から分離) |

### シェルモード (ESKitShellMode)

- `window.matchMedia("(max-width: 768px)")` で自動検出
- `System.setShellMode("mobile")` で手動上書き可能、`.shellMode.unlock()` で自動復帰
- モード変更時 → `"shell:mode-changed"` イベント → 全 Web Components が `mode` 属性を参照して自律的にレイアウト切替

| | desktop モード | mobile モード |
|--|---------------|--------------|
| ウィンドウ | カード形式 (縦スクロール) | アクティブのみ全画面 |
| 別アプリ切替 | 常時表示 | ドロワーから選択 |
| アプリを閉じる | カード消去 | ドロワーが自動で開く |
| ランチャー | 上部バー (入力) | 非表示 |
| ホームバー | 非表示 | 固定下部 |
| ドロワー | 非表示 | ホームボタンで開閉 |

---

## Phase 2: Window Management — ウィンドウ管理

**目的:** デスクトップ OS らしいウィンドウ操作を実現する。  
**完了条件:** 複数ウィンドウのドラッグ・リサイズ・最小化・最大化・復元・スナップ・Z-order が動作する。

### `system/elements/window/main.js` — ESKitWindowElement 強化

**状態機械:**
```
normal ↔ minimized
normal ↔ maximized
(snapped は normal の一種、_prevRect で復元)
```

**追加メソッド:**
```js
class ESKitWindowElement extends HTMLElement {
  _state:    "normal" | "minimized" | "maximized"
  _prevRect: { left, top, width, height } | null

  focus(): void        // z-index 最前面 + .focused クラス
  minimize(): void
  maximize(): void
  restore(): void
  snap(side: "left" | "right"): void
}
```

**タイトルバー構造:**
```html
<div class="app-header">
  <span class="app-title">…</span>
  <div class="app-controls">
    <button class="btn-minimize">–</button>
    <button class="btn-maximize">□</button>
    <button class="btn-close">✕</button>
  </div>
</div>
```

**ドラッグ:** `.app-header` の `pointerdown/pointermove/pointerup` + `setPointerCapture`

**リサイズ:** 8 方向ハンドル (`.resize-n/s/e/w/ne/nw/se/sw`) + pointer events。`MIN_W=220, MIN_H=120`

**スナップ:** `pointerup` 時の `clientX/Y` で判定:
- `y <= 8` → `maximize()`
- `x <= 8` → `snap("left")`
- `x >= innerWidth - 8` → `snap("right")`

### `system/window.js` — ESKitWindowSystem 変更

- `open(uuid)`: カスケード配置 (offset `30 + 28 * n`)、`appElement.focus()` で前面に
- `getAllElements()`: 全ウィンドウ要素取得 (タスクバーから利用)

**関連ファイル:** `system/elements/window/main.js`, `system/elements/window/style.js`, `system/window.js`

---

## Phase 3: Desktop Shell — シェル UI

**目的:** タスクバー、ランチャー UI 刷新、コンテキストメニューでデスクトップ OS の外観を実現する。  
**完了条件:** ランチャーからアプリを選択起動でき、タスクバーでアプリ一覧・切り替えができる。

### `system/elements/taskbar/` (新規)

**ESKitTaskbarElement:**
- 固定下部バー (height: 48px, z-index: 9999)
- ランチャーボタン (☰) → `System.events.emit("launcher:toggle")`
- アプリリスト: `System.listProcesses()` をイベント購読で更新
- システムトレイ: 時計 (10 秒更新 `setInterval`)
- デスクトップモード専用 (`:host([mode="mobile"]) { display: none }`)

### `system/elements/launcher/` — UI 刷新

**ESKitLauncherElement 変更:**  
テキスト入力式 → グリッド UI (`[open]` 属性で表示)
- `show()` / `hide()` / `toggle()` メソッド
- `System.registry.list()` からアプリグリッド生成
- 検索 `<input>` → `System.registry.search(query)` でフィルタリング
- オーバーレイクリックで `hide()`
- `launcher:toggle` イベントを購読

### `system/elements/context-menu/` (新規)

**ESKitContextMenuElement:**
```js
show(x: number, y: number, items: MenuItem[]): void
hide(): void
// MenuItem: { label: string, action: () => void } | { separator: true }
```
- デスクトップ右クリックでデフォルトメニュー表示
- `contextmenu` イベントを `window.js` の `#initContextMenu()` でハンドル

### `system/system.js` — `initUI()` 実装

- タスクバー・ランチャー・コンテキストメニューの初期化
- `system:ready` イベント後に実行

**関連ファイル:** `system/elements/taskbar/main.js`, `style.js` (新規), `system/elements/launcher/main.js`, `style.js` (変更), `system/elements/context-menu/main.js`, `style.js` (新規)

---

## Phase 4: System Services — システムサービス

**目的:** 通知、テーマエンジン、i18n、設定アプリの基盤サービスを実装する。  
**完了条件:** テーマ切替で UI 全体が即座に変わり、通知が表示・自動消去され、言語切替が反映される。

### `system/theme.js` — テーマエンジン (新規)

```js
class ESKitTheme {
  static PRESETS: Record<string, Record<string, string>>  // "light", "dark"
  current: string
  presets: string[]
  apply(name: string, customVars?: Record<string, string>): void
  setWallpaper(value: string): void
}
```
- CSS カスタムプロパティ (`document.documentElement.style.setProperty`)
- `localStorage` で永続化
- 壁紙: `--eskit-wallpaper` CSS 変数

**CSS 変数一覧 (拡張):**
```
--eskit-color-text         --eskit-color-background    --eskit-color-border
--eskit-color-primary      --eskit-color-success       --eskit-color-error
--eskit-color-warning      --eskit-wallpaper
```

### `system/i18n.js` — 多言語対応 (新規)

```js
class ESKitI18n {
  async load(lang: string): Promise<void>  // system/i18n/{lang}.json を fetch
  t(key: string, vars?: Record<string, string>): string  // テンプレート補間対応
  get current(): string    // 現在の言語コード
  get available(): string[]
  extend(appId: string, lang: string, dict: Record<string, string>): void  // アプリ独自辞書
}
```
- 言語パック: `system/i18n/ja.json`, `system/i18n/en.json`
- `navigator.language` で起動時自動選択 → `localStorage` でオーバーライド可
- `system:locale-changed` イベントで UI 自動更新

### `system/elements/notification/` (新規)

**ESKitNotificationElement:**
- `System.events.on("notification:show", handler)` で自動表示
- トースト形式 (右上固定) + `@starting-style` + `transition` でスライドイン/アウト
- クリックまたは `duration` 経過で消去

### `apps/settings/` — 設定アプリ (新規)

タブ構成:
- **外観:** テーマプリセット選択・壁紙グリッド (6 種)
- **言語:** `System.i18n.available` からドロップダウン選択
- **システム:** 実行中プロセス数・登録アプリ数
- **権限:** インストール済みアプリの権限一覧 + 個別取り消し UI

**関連ファイル:** `system/theme.js`, `system/i18n.js`, `system/i18n/ja.json`, `system/i18n/en.json`, `system/elements/notification/`, `system/system.js`, `apps/settings/`

---

## Phase 5: Developer Experience & Apps — 開発者体験とサンプルアプリ

**目的:** アプリ開発の実例を示し、外部アプリインストール機能を実装し、ドキュメントを整備する。  
**完了条件:** ドキュメントだけ読んで新規アプリを作成・登録でき、外部 URL からアプリをインストールできる。

### サンプルアプリ (新規 4 アプリ)

| アプリ | 機能 | 利用 API | 宣言権限 |
|--------|------|---------|---------|
| `apps/notepad/` | テキストエディタ、仮想 FS へ保存/読込 | `System.fs.writeFile/readFile`, `showNotification` | `fs.read`, `fs.write`, `notifications` |
| `apps/calculator/` | 四則演算電卓 | `this.querySelector` | (なし) |
| `apps/clock/` | 時計 / ストップウォッチ / タイマー | `close()` で interval 解除、`showNotification` | `notifications` |
| `apps/filemanager/` | 仮想 FS ブラウザ、ファイル作成・削除・リネーム | `System.fs.*` 全 API | `fs.read`, `fs.write` |

### 外部アプリインストール — `ESKitRegistry.registerFromUrl` 実装

**フロー:**
1. `{url}/define.json` を fetch してマニフェスト取得・バリデーション
2. Popover API でユーザー確認ダイアログ (アプリ名・バージョン・要求権限を提示)
3. ユーザーが承認 → `registry.registerManual(id, manifest)` で登録
4. エントリポイントを動的 `import()` でロード
5. `localStorage` に登録情報を永続化 → 次回起動時に自動復元

**セキュリティ:**
- HTTPS URL のみ許可 (http:// は即拒否)
- `permissions[]` に `network` がなければ外部 fetch 不可
- インストール確認ダイアログで全権限を明示

**関連ファイル:** `apps/notepad/`, `apps/calculator/`, `apps/clock/`, `apps/filemanager/`, `system/registry.js` (registerFromUrl 実装)

---

## システムイベント一覧

| イベント | ペイロード | 発行タイミング |
|---------|----------|--------------|
| `system:ready` | — | ブート完了 |
| `system:theme-changed` | `{ name }` | テーマ変更 |
| `system:locale-changed` | `{ lang }` | 言語変更 |
| `app:opened` | `{ uuid, name }` | アプリ起動 |
| `app:closed` | `{ uuid }` | アプリ終了 |
| `app:focused` | `{ uuid }` | フォーカス変更 |
| `app:titleChanged` | `{ uuid, title }` | タイトル変更 |
| `notification:show` | `{ title?, message?, duration? }` | 通知表示 |
| `launcher:toggle` | — | ランチャー開閉 |
| `shell:mode-changed` | `{ mode, prev }` | desktop/mobile 切替 |
| `drawer:open` | — | ドロワーが開かれた |
| `drawer:close` | — | ドロワーが閉じられた |

---

## 権限一覧

| 権限 | 対象 API |
|------|---------|
| `fs.read` | `System.fs.readFile`, `readFileAsBytes`, `readdir`, `stat`, `exists` |
| `fs.write` | `System.fs.writeFile`, `mkdir`, `remove`, `rename` |
| `notifications` | `System.notify`, `this.showNotification` |
| `ipc` | `System.sendMessage` |
| `network` | 外部 URL への `fetch` |
| `system.info` | `System.listProcesses` 等 |
| `clipboard` | `navigator.clipboard.*` ラッパー |

---

## ディレクトリ構成 (完成形)

```
index.html
main.js
README.md
API.md
PLAN.md
system/
  main.css
  util.js
  event-bus.js
  filesystem.js
  manifest.js
  permissions.js
  registry.js
  shell-mode.js
  app.js
  system.js
  window.js
  theme.js              (Phase 4)
  i18n.js               (Phase 4)
  i18n/
    ja.json             (Phase 4)
    en.json             (Phase 4)
  elements/
    desktop/
    window/
    launcher/
    drawer/
    home-bar/
    permission-dialog/
    taskbar/            (Phase 3)
    context-menu/       (Phase 3)
    notification/       (Phase 4)
apps/
  test/
  welcome/
  settings/             (Phase 4)
  notepad/              (Phase 5)
  calculator/           (Phase 5)
  clock/                (Phase 5)
  filemanager/          (Phase 5)
```
