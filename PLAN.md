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
- **エコシステム構成 (マルチリポジトリ):**
  - `eskit`: コアフレームワーク & OS 環境 (PWA, Vanilla JS)
  - `eskpt`: ESKit 専用パッケージレジストリサービス (Void.cloud / Vite)
  - `eskit-docs`: 開発者ポータル & チュートリアル & プレイグラウンド (Blume / useblume.dev)

---

## 現状 (Phase 1～5 完了 / Phase 6 i18n 包括対応・最終完了中)

| ファイル | 実装内容 |
|----------|---------|
| `system/util.js` | `css` / `html` タグ関数 (補間対応) |
| `system/event-bus.js` | ESKitEventBus — pub/sub |
| `system/filesystem.js` | ESKitFileSystem — IndexedDB VFS (Uint8Array, バイナリ対応) |
| `system/manifest.js` | ESKitManifest — `define.json` を fetch・バリデーション (fileAssociations 対応) |
| `system/permissions.js` | ESKitPermissions — 2 段階権限管理 + ダイアログ |
| `system/registry.js` | ESKitRegistry — アプリ登録・検索・URL インストール・拡張子関連付け検索 |
| `system/shell-mode.js` | ESKitShellMode — desktop/mobile モード管理 |
| `system/app.js` | ESKitApp — ライフサイクルフック・開発者 API (`this.fs`, `this.sendMessage`, `this.listProcesses`, `this.showNotification`, `this.t`, `this.onOpenFile`) |
| `system/system.js` | ESKitSystem — カーネル (boot, loadApp, openFile, IPC, notify, theme, i18n, dialog, notifications) |
| `system/window.js` | ESKitWindowSystem — モード対応ウィンドウ管理 |
| `system/elements/desktop/` | `eskit-desktop` — デスクトップルート要素 |
| `system/elements/window/` | `eskit-window` — アプリウィンドウ (desktop/mobile 対応) |
| `system/elements/launcher/` | `eskit-launcher` — デスクトップモード用ランチャー (グリッド UI + 検索) |
| `system/elements/taskbar/` | `eskit-taskbar` — デスクトップモード用タスクバー (ランチャーボタン・アプリ一覧・時計) |
| `system/elements/drawer/` | `eskit-drawer` — モバイル用アプリドロワー |
| `system/elements/home-bar/` | `eskit-home-bar` — モバイル用ホームバー |
| `system/elements/permission-dialog/` | `eskit-permission-dialog` — 権限確認ダイアログ (Web Component) |
| `system/elements/login-screen/` | `eskit-login-screen` — ログイン画面 (Phase 4) |
| `apps/test/` | SystemVerifier — システム検証アプリ |
| `apps/welcome/` | WelcomeApp — ようこそ画面 |
| `apps/eskish/` | ESKish — 標準ターミナル環境 (Phase 4.5 / 6) |
| `README.md` | 日本語 README |
| `API.md` | API リファレンス (README から分離) |
| `system/kitstrap2.js` | Singleton CSSStyleSheet — kitstrap2 を Shadow DOM 全体に共有 |
| `system/kitstrap2.css` | kitstrap2 CSS フレームワーク本体 |
| `system/main.css` | `--eskit-*` → `var(--kit-*)` CSS 変数ブリッジ |
| `system/elements/context-menu/` | `eskit-context-menu` — 右クリックコンテキストメニュー (Phase 3) |
| `system/elements/beacon/` | `eskit-beacon` — グローバル検索オーバーレイ (Phase 3) |
| `system/elements/quick-settings/` | `eskit-quick-settings` — クイック設定パネル (Phase 3/5) |
| `system/hamon.js` | Hamon — リアクティブテンプレートエンジン (Phase 3.5) |
| `system/users.js` | ESKitUsers — ユーザー管理・認証 (Phase 4) |
| `system/icons.js` | ESKitIcons & `<eskit-icon>` — アイコンシステム (Phase 4.8) |
| `system/theme.js` | ESKitTheme — テーマ & 壁紙管理 (Phase 5) |
| `system/themes/presets.js` | 組み込みテーマ & 壁紙プリセット (Phase 5) |
| `system/i18n.js` | ESKitI18n — 多言語辞書 & リアクティブ翻訳 (Phase 5) |
| `system/elements/dialog/` | `eskit-dialog` — 汎用ダイアログ要素 (Phase 5) |
| `system/elements/file-picker/` | `eskit-file-picker` — 汎用ファイル選択ダイアログ (Phase 5/6) |
| `system/elements/notification/` | `eskit-notification` / `eskit-notification-container` — 通知トースト (Phase 5) |
| `apps/settings/` | SettingsApp — システム設定アプリ (Phase 5) |
| `manifest.webmanifest` | PWA Web App Manifest (Phase 6) |
| `sw.js` | PWA Service Worker (Network-First, Phase 6) |
| `system/pwa.js` | PWA ライフサイクル & アップデート通知 (Phase 6) |
| `icons/icon.svg` | PWA ベクターアイコン (Phase 6) |
| `apps/notepad/` | NotepadApp — テキストエディタ (Phase 6) |
| `apps/calculator/` | CalculatorApp — 電卓 (Phase 6) |
| `apps/clock/` | ClockApp — 時計/ストップウォッチ/タイマー (Phase 6) |
| `apps/filemanager/` | FileManagerApp — 仮想 FS ブラウザ (Phase 6) |

### シェルモード (ESKitShellMode)

- `window.matchMedia("(max-width: 768px)")` で自動検出
- `globalThis.System.setShellMode("mobile")` で手動上書き可能、`.shellMode.unlock()` で自動復帰
- モード変更時 → `"shell:mode-changed"` イベント → 全 Web Components が `mode` 属性を参照して自律的にレイアウト切替

| | desktop モード | mobile モード |
|--|---------------|--------------|
| ウィンドウ | カード形式 (縦スクロール) | アクティブのみ全画面 |
| 別アプリ切替 | タスクバーから選択 | ドロワーから選択 |
| アプリを閉じる | カード消去 | ドロワーが自動で開く |
| タスクバー | 固定下部 (ランチャーボタン・アプリ一覧・時計) | 非表示 |
| ランチャー | オーバーレイ (グリッド + 検索) | 非表示 |
| ホームバー | 非表示 | 固定下部 |
| ドロワー | 非表示 | ホームボタンで開閉 |

---

## Phase 2: Window Management — ウィンドウ管理 ✅

**目的:** デスクトップ OS らしいウィンドウ操作を実現する。  
**完了条件:** 複数ウィンドウのドラッグ・リサイズ・最小化・最大化・復元・スナップ・Z-order が動作する。  
**ステータス:** 実装済み

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

## Phase 3: Desktop Shell — シェル UI ✅

**目的:** コンテキストメニュー・スポットライト検索・クイック設定・ウィンドウアニメーションを追加し、モダン OS らしいシェル体験を実現する。  
**完了条件:** 右クリックメニュー・Ctrl+Space 検索・クイック設定パネル・ウィンドウ開閉アニメーションが動作する。  
**ステータス:** 実装済み

> **Note:** タスクバー (`eskit-taskbar`) とランチャー UI 刷新 (`eskit-launcher`) は Phase 1 で実装済み。

### `system/elements/context-menu/` (新規)

**ESKitContextMenuElement:**
```js
show(x: number, y: number, items: MenuItem[]): void
hide(): void
// MenuItem: { label: string, action: () => void } | { separator: true }
```
- デスクトップ右クリックでデフォルトメニューを表示:
  - 「ランチャーを開く」→ `launcher:toggle` 発行
  - 「シェルモード切替」→ `System.setShellMode()`
  - 区切り線 + 将来の拡張 (壁紙変更・設定を開く 等)
- `contextmenu` イベントを `window.js` の `#initContextMenu()` でハンドル
- Popover API で表示 (`popover="manual"`)、画面端でポジション自動補正
- 他クリック (`pointerdown` outside) / Escape キーで `hide()`

### `system/elements/beacon/` (新規)

**ESKitBeaconElement** — グローバル検索オーバーレイ:
```js
show(): void
hide(): void
// Ctrl+Space / Cmd+Space でトグル
```
- `position: fixed; inset: 0; z-index: 20000` のオーバーレイ
- 上部中央に検索バー (`<input>`) を配置。フォーカス自動付与
- `System.registry.search(query)` でアプリ候補をリアルタイム表示
- 候補クリック → `System.loadApp(manifest._dir)` → `hide()`
- Enter キーで最上位候補を起動
- `keydown` を `window` でキャプチャ: `Ctrl+Space` でトグル、`Escape` で閉じる
- 将来的に VFS ファイル検索も統合 (Phase 6)

### `system/elements/quick-settings/` (新規)

**ESKitQuickSettingsElement** — タスクバーのシステムトレイから展開するパネル:
```js
show(anchorEl: HTMLElement): void
hide(): void
toggle(anchorEl: HTMLElement): void
```
- CSS Anchor Positioning で時計ボタンの直上に `position-area: top span-right` 配置
- パネル内容:
  - **シェルモード:** desktop / mobile の切替トグル
  - **明暗テーマ:** OS に連動 (`prefers-color-scheme`) / ライト / ダーク の 3 択 (Phase 5 テーマ実装後に有効化)
  - **システム情報:** 起動中プロセス数、FS 使用量 (Phase 5 連携)
- `ESKitTaskbarElement` が時計要素 (`#clock`) のクリックイベントで `toggle()` を呼ぶ
- 外側クリック / Escape で `hide()`

### ウィンドウ開閉アニメーション

**`system/elements/window/style.js` 追加:**
- `@starting-style` + `transition` でウィンドウのスケール・フェードイン (`scale(0.92)` → `scale(1)`)
- `prefers-reduced-motion: reduce` でアニメーション無効化 (アクセシビリティ)

### `system/system.js` — `initUI()` 実装

- コンテキストメニュー・スポットライト・クイック設定の初期化
- グローバルキーバインド (`Ctrl+Space`) の登録
- `system:ready` イベント後に実行

**関連ファイル:** `system/elements/context-menu/main.js`, `style.js` (新規), `system/elements/beacon/main.js`, `style.js` (新規), `system/elements/quick-settings/main.js`, `style.js` (新規), `system/elements/window/style.js` (変更), `system/elements/desktop/main.js` (変更), `system/elements/taskbar/main.js` (変更), `system/system.js` (変更)

---

## Phase 3.5: Hamon — リアクティブテンプレートエンジン ✅

**目的:** ESKit アプリ開発における以下の課題を解決するリアクティブテンプレートエンジン「Hamon」を導入する。  
**完了条件:** Hamon テンプレートで記述したアプリが、シグナル変更で自動 DOM 更新・イベント自動登録/解除・条件分岐のリアクティブ切替を行える。既存の文字列テンプレートアプリも変更なしで動作する (後方互換)。  
**ステータス:** 実装済み

### 解決する課題

1. **イベントリスナーの手動 add / remove** — `@click` 属性構文で自動登録、スコープ dispose で自動解除
2. **状態変化に合わせた手動 DOM 更新** — シグナルに依存する DOM ノードを直接・最小限に更新
3. **条件分岐・リスト描画の煩雑な命令的記述** — `kit-if` / `kit-else` ディレクティブ、`list()` ヘルパー

### 設計方針・決定事項

- **リアクティビティ:** シグナル方式 (VDOM なし)。各シグナルに依存する DOM ノードを直接更新する (SolidJS に近い方式)
- **テンプレート:** タグ付きテンプレートリテラル `hamon` + `kit-` ディレクティブ
- **イベント:** `@click` 形式 (属性構文)
- **属性バインド:** `:value` 形式
- **条件分岐:** `kit-if` / `kit-else` 属性ディレクティブ
- **リスト描画:** `list(itemsFn, renderFn)` ヘルパー関数
- **単一ファイル:** `system/hamon.js` に全実装を収める (ビルド不要哲学)
- **後方互換:** 文字列テンプレートは従来どおり `innerHTML` でマウント

### `system/hamon.js` — リアクティブプリミティブ (新規)

**signal(initial):**
```js
const count = signal(0);
count.value;      // 0 (get — 実行中 effect があれば依存登録)
count.value = 1;  // set — 依存する effect を再実行
count.peek();     // 依存追跡なしで値を読む
```

**computed(fn):**
```js
const double = computed(() => count.value * 2);
double.value; // 2 (読み取り専用、依存元が変われば自動再計算)
```

**effect(fn):**
```js
const dispose = effect(() => {
  console.log(count.value); // count が変わるたびに再実行
  return () => { /* クリーンアップ */ };
});
dispose(); // 手動解除
```

**HamonScope:**
```js
const scope = new HamonScope();
const s = scope.signal(0);
scope.effect(() => console.log(s.value));
scope.onDispose(() => { /* 任意のクリーンアップ */ });
scope.dispose(); // スコープ内の全 effect を一括解除
```

### `system/hamon.js` — テンプレートエンジン

**`hamon` タグ付きテンプレートリテラル:**
```js
import hamon, { signal } from "system/hamon.js";

const count = signal(0);
const fragment = hamon`
  <button @click=${() => count.value++}>
    Count: ${() => count.value}
  </button>
  <input :value=${() => count.value} :disabled=${() => count.value > 10}>
  <p kit-if=${() => count.value > 5}>High!</p>
  <p kit-else>Low</p>
`;
// fragment: リアクティブな DocumentFragment
// fragment._scope: HamonScope (dispose で全バインディング解除)
```

**テキスト補間:**
- `${value}` — 静的値をそのまま挿入
- `${() => expr}` — 関数: effect で自動更新される Text ノード (戻り値が Node/Fragment なら DOM 挿入)
- `${signal}` — Signal の `.value` をバインド

**イベントバインディング `@event`:**
- `@click=${handler}` → `addEventListener("click", handler)`
- scope dispose 時に自動 `removeEventListener`

**属性バインディング `:attr`:**
- `:value=${signal}` / `:disabled=${() => bool}` / `:class=${() => str}`
- `value`, `checked`, `selected`, `disabled` は DOM プロパティ直接設定
- その他は `setAttribute` / `removeAttribute`

### `system/hamon.js` — ディレクティブ

**`kit-if` / `kit-else`:**
```html
<div kit-if=${() => show.value}>表示</div>
<div kit-else>非表示</div>
```
- Comment ノードをアンカーとして位置を記憶
- 条件の真偽で DOM 挿入/除去 (ノード実体は保持し再生成しない)
- `kit-else` は直前の `kit-if` 要素の兄弟要素として連動

**`list()` リスト描画ヘルパー:**
```js
const items = signal(["A", "B", "C"]);
hamon`
  <ul>
    ${list(() => items.value, (item, i) => hamon`<li>${item}</li>`)}
  </ul>
`;
```
- 配列シグナルの変化に応じてリスト部を再レンダー（現状は全体再構築）
- 将来的には各アイテムの Fragment `_scope` を追跡し、除去時に dispose する差分更新に対応予定

### ESKitApp 統合

**`system/app.js` 変更:**
- `this.hamon` プロパティ: `HamonScope` の遅延生成ゲッター
- テンプレートに `hamon` タグ関数の戻り値 (DocumentFragment) を設定可能

**`system/window.js` 変更:**
- `open()` メソッド内でテンプレートの型判定:
  - `DocumentFragment` → `templateEl.appendChild(fragment)` (Hamon パス)
  - `string` → `templateEl.innerHTML = template` (後方互換パス)
- Hamon テンプレートの `_scope` をアプリインスタンスに紐付け

**`system/system.js` 変更:**
- `closeApp()` 内で `app._hamonScope?.dispose()` を呼び出し、全 effect を一括解除

### Hamon を使ったアプリの例 (before / after)

**Before (手動 DOM 操作):**
```js
export default class CounterApp extends ESKitApp {
  static template = html`<button id="btn">Count: 0</button>`;
  initialize() {
    let count = 0;
    const btn = this.querySelector("#btn");
    btn.addEventListener("click", () => {
      count++;
      btn.textContent = `Count: ${count}`;
    });
  }
}
```

**After (Hamon):**
```js
import hamon, { signal } from "system/hamon.js";
export default class CounterApp extends ESKitApp {
  constructor() {
    super();
    const count = signal(0);
    this.template = hamon`
      <button @click=${() => count.value++}>
        Count: ${() => count.value}
      </button>
    `;
  }
}
```

※ `WindowSystem.open()` は `initialize()` より前に `template` をマウントするため、Hamon テンプレートは constructor（または static `template`）で設定する。`initialize()` はマウント後のイベント購読・初期データ取得などに引き続き利用する。

### 将来の拡張 (Phase 3.5 スコープ外)

- **`kit-model` 双方向バインド:** `:value` + `@input` の頻出パターン用ショートハンド
- **テンプレートキャッシュ:** tagged template の `strings` 参照同一性を利用した WeakMap キャッシュ
- **既存システム要素の Hamon 化:** taskbar, launcher 等の段階的移行 (オプトイン)

**関連ファイル:** `system/hamon.js` (新規), `system/app.js` (変更), `system/window.js` (変更), `system/system.js` (変更)

---

## Phase 4: Multi-User Foundation — ユーザー概念導入 ✅

**目的:** ユーザー概念を導入し、ログインセッション・ホームディレクトリ分離・所有者/モードに基づくアクセス制御を実現する。  
**完了条件:** 管理者作成・ログイン・ユーザー切替・ユーザーごとの権限分離・`/home/{userId}` 分離が動作し、`/home/user` 依存が除去される。  
**ステータス:** 完了

### 決定事項

- **パス規約:** `/home/user` は廃止し、`/home/{userId}` に統一
- **認証:** ローカル完結のパスワードハッシュ (Web Crypto / PBKDF2)
- **ロール:** 管理者 1 名 + 一般ユーザー
- **共有領域:** `/shared` を導入し、アクセス制御対象に含める
- **権限分離:** 同一アプリでもユーザーごとに runtime 権限を独立管理
- **カーネル API とアプリファサードの分離:** `System.fs` 等の直接呼出しはカーネル・システム内部専用とし、アプリからは `this.fs` (FS), `this.sendMessage` (IPC), `this.listProcesses` (System Info) 等の権限検証ファサードの利用を規約化
- **特権保護:** 管理者作成 (`isAdmin: true`) およびユーザー削除は管理者セッションを必須化
- **ディレクトリ階層整合性:** ディレクトリの `rename` 時に配下の子孫エントリを同一トランザクションで再帰的更新

### `system/users.js` (新規)

**ESKitUsers** — ユーザー管理・セッション管理:
```js
class ESKitUsers {
  async init(): Promise<void>
  list(): User[]
  getCurrent(): User | null
  async create({ id, name, password, isAdmin }): Promise<User>
  async delete(id: string): Promise<void>
  async login(id: string, password: string): Promise<User>
  logout(): void
}
```

**User モデル:**
```ts
type User = {
  id: string;
  name: string;
  isAdmin: boolean;
  passwordHash: string;
  salt: string;
  createdAt: number;
  disabled?: boolean;
};
```

- ストレージ: `localStorage` (ユーザー一覧 / 現在セッション)
- ハッシュ: PBKDF2 (SHA-256) + ランダム salt
- 初回起動時は管理者ユーザー（パスワードなし）を自動作成して自動ログイン
- ユーザー ID: 1〜31 文字の英小文字開始文字列 (`/^[a-z][a-z0-9_-]{0,30}$/`)
- 管理者保護: 初回以降の `isAdmin: true` 作成および `delete()` は管理者セッションを必須化

### `system/system.js` — 起動シーケンス変更

```text
ESKitSystem.constructor()
  └─ #boot() [async]
       ├─ fs.init()
       ├─ users.init()
       ├─ #initBaseDirs()         /home, /shared, /system, /apps
       ├─ #ensureDefaultAdmin()   デフォルト管理者自動作成（自動ログイン）
       ├─ #ensureLogin()          ログイン（初回は自動ログインで通過）
       ├─ #initCurrentUserDirs()  /home/{userId}/desktop など
       ├─ new ESKitWindowSystem
       ├─ #registerBuiltinApps()
       ├─ initUI()
       └─ events.emit("system:ready")
```

### `system/filesystem.js` — owner/mode 導入

**エントリ形式拡張:**
```js
{ path, parent, type, content, owner, mode, createdAt, modifiedAt }
```

- デフォルト mode: ESKit 独自の可読オブジェクト形式
  - file: `{ owner: {read:true, write:true}, others: {read:false, write:false} }`
  - dir:  `{ owner: {read:true, write:true}, others: {read:true, write:false} }`
- `stat()` 返却に `owner`, `mode` を追加
- `read/write/readdir/remove/rename` でアクセス制御を実施
  - 一般ユーザー: 自身のホーム中心
  - 管理者: システムポリシー上許可された範囲で横断アクセス可
- ディレクトリ `rename()` は子孫エントリを再帰的にパス更新

### ログイン UI / 切替 UI

- `system/elements/login-screen/` (新規): ログイン画面
- `system/elements/quick-settings/` (変更): 現在ユーザー表示 / ログアウト / 切替
- `system/elements/drawer/` (変更): モバイル導線の追加

### マイグレーションと互換

- 旧 `/home/user` 依存コードは段階的に `/home/{userId}` へ置換
- 旧権限キーはユーザー単位キーへ移行 (`userId` を含む)
- 破壊的変更を許容する開発方針に従い、必要時は初期化リセットを許容

**関連ファイル:** `system/users.js` (新規), `system/system.js` (変更), `system/filesystem.js` (変更), `system/permissions.js` (変更), `system/app.js` (変更), `system/elements/login-screen/` (新規), `system/elements/quick-settings/` (変更), `system/elements/drawer/` (変更), `apps/test/` (変更)

---

## Phase 4.5: ESKish — ターミナルアプリ ✅

**目的:** ESKit のマルチユーザー・権限モデル・ファイルシステム・プロセス管理をコマンドラインから操作・検証できる標準ターミナルアプリ「ESKish」を導入する。  
**完了条件:** ターミナルウィンドウからファイル操作・プロセス管理・ユーザー確認・JS式評価を実行でき、コマンド履歴・カレントディレクトリ表示が動作する。  
**ステータス:** 完了

> 詳細は [API.md](API.md#eskish--ターミナルアプリ) を参照

### 設計方針・決定事項

- **実行モデル:** Unix 風シェル体系に特化しつつ、コマンド名は **EcmaScript / ESKit API 風の独自命名** (`readFile`, `writeFile`, `readDir`, `makeDir`, `remove`, `rename`, `changeDir`, `listProcesses`, `loadApp`, `closeApp`, `currentUser`, `eval` 等) を採用
- **JavaScript 実行:** `eval <code...>` コマンドに限定し、現在ログイン中のユーザー権限（`this`, `this.fs`, `System`）で実行
- **CWD (作業ディレクトリ):** 初期値は `/home/{userId}`。相対パスおよび `~` (ホーム展開) をサポート
- **プロンプト形式:** `{userId}@eskit:{path}$ ` (ホーム配下は `~` で短縮表示)
- **UI 構造:** プレーンテキスト主体の軽量ターミナル (テキストログ、`↑`/`↓` コマンド履歴、自動スクロール)
- **組み込み登録:** `system/system.js` の `#registerBuiltinApps()` に `"apps/eskish/"` として常備

### `apps/eskish/` (新規)

- `define.json`: マニフェスト (要求権限: `fs.read`, `fs.write`, `system.info`, `notifications`, `ipc`, `user.info`, `user.manage`)
- `main.js`: `ESKishApp` クラス (CWD 管理、パス解決、コマンドパーサー、履歴管理)
- `style.js`: ターミナル UI スタイル (ダークモノスペーステーマ)

**関連ファイル:** `apps/eskish/define.json` (新規), `apps/eskish/main.js` (新規), `apps/eskish/style.js` (新規), `system/system.js` (変更)

---

## Phase 4.8: Icon System — アイコンセットと Lucide Icons 統合

**目的:** 絵文字や記号文字に依存していたシステム UI（ウィンドウ操作、コンテキストメニュー、Beacon、タスクバー、ランチャー、ドロワー、クイック設定、ログイン画面等）およびアプリのアイコン表示を刷新し、**アイコンセット (Icon Set)** の概念に基づいた一貫性のある Lucide Icons 基盤を導入する。  
**完了条件:** `<eskit-icon set="..." name="...">` Web Component および `icon(set, name, options)` ヘルパーが動作し、`System.icons` レジストリによりセット単位でアイコンが管理・描画され、`define.json` マニフェストの `icon` オブジェクト指定が解釈・表示される。  
**ステータス:** 完了

### 設計方針・決定事項

- **アイコンセット (Icon Set) モデル:** アイコンは単一の `name` ではなく、**`set` (アイコンセット名) と `name` (アイコン名)** の 2 つのキーで常に明示的に解決する（`<eskit-icon set="lucide" name="search">`）。
- **ビルド不要・完全ローカル自己完結:** 外部 CDN や npm ビルドに一切依存せず、`system/icons.js` に標準の `"lucide"` アイコンセットの SVG 定義を同期マップとして保持する。
- **Web Component `<eskit-icon>`:**
  - 属性: `set`, `name`, `size`, `stroke-width`, `color`
  - スタイル: `display: inline-flex`, `vertical-align: middle`, `color: currentColor`, デフォルトサイズ `1em`。CSS 変数 `--eskit-icon-size`, `--eskit-icon-stroke-width` によるオーバーライドに対応。
- **ヘルパー関数 `icon(set, name, options)`:**
  - Hamon テンプレートや動的 DOM 生成向けに、`<eskit-icon>` 要素または SVG ノードを返す関数を提供。
- **マニフェスト (`define.json`) 形式:**
  - `icon` フィールドはオブジェクト形式 `{ type: "set" | "image", ... }` で統一:
    - アイコンセット: `{ "type": "set", "set": "lucide", "name": "terminal" }`
    - 画像ファイル: `{ "type": "image", "src": "icon.png" }`

### `system/icons.js` — アイコンレジストリ (新規)

**ESKitIcons:**
```js
class ESKitIcons {
  registerSet(setId: string, icons: Record<string, string>): void
  get(setId: string, name: string): string | null
  has(setId: string, name?: string): boolean
  listSets(): string[]
  listIcons(setId: string): string[]
}
```

- **組み込みセット (`lucide`):**
  - OS 起動時に `system/icons.js` 内の主要 Lucide アイコン（約50〜100種: ウィンドウ制御、検索、設定、ファイル、ターミナル、電源、ユーザー、テーマ、各種状態表示等）を `"lucide"` セットとして同期登録。
- **アプリによる拡張:**
  - アプリやプラグインは `System.icons.registerSet("my-app-set", { icon1: "<svg...>...", ... })` により独自のアイコンセットを登録可能。

### `system/elements/icon/` (新規)

**ESKitIconElement (`eskit-icon`):**
```html
<eskit-icon set="lucide" name="search" size="18"></eskit-icon>
```
- Shadow DOM 内で SVG を描画。`currentColor` に追従。
- `observedAttributes`: `["set", "name", "size", "stroke-width", "color"]`
- `set` または `name` 変更時に `System.icons.get(set, name)` を再取得して描画。存在しない場合はフォールバック表示。

### 既存 UI / アプリの Lucide アイコン置換スコープ

| コンポーネント | 対象箇所 | 置換前 | 置換後 (`set="lucide"`) |
|--------------|---------|-------|------------------------|
| `eskit-window` | タイトルバー操作ボタン | `–`, `□`, `✕` | `minus`, `square` / `maximize-2`, `x` |
| `eskit-context-menu` | デフォルトメニュー項目 | `💠`, `🔍`, `🔄` | `monitor-smartphone`, `search`, `refresh-cw` |
| `eskit-beacon` | 検索バー・結果フォールバック | `🔍`, `🪄` | `search`, `sparkles` |
| `eskit-launcher` | ランチャーボタン・アプリアイコン | `🪄` | マニフェストの `icon` または `sparkles` |
| `eskit-drawer` | ドロワーアプリアイコン | `🪄` | マニフェストの `icon` または `sparkles` |
| `eskit-quick-settings` | モード、テーマ、システム項目 | 文字/記号 | `monitor-smartphone`, `sun`, `moon`, `cpu`, `hard-drive` |
| `eskit-login-screen` | 入力欄・ボタン | 文字 | `user`, `lock`, `arrow-right` |
| `apps/eskish/` | マニフェスト `icon` | `"icon.png"` | `{ "type": "set", "set": "lucide", "name": "terminal" }` |
| `apps/welcome/` | マニフェスト `icon` | `"icon.png"` | `{ "type": "set", "set": "lucide", "name": "sparkles" }` |
| `apps/test/` | 検証状態アイコン | `⏳`, `✅`, `❌` | `clock`, `check-circle-2`, `x-circle` |

**関連ファイル:** `system/icons.js` (新規), `system/elements/icon/main.js` (新規), `system/elements/icon/style.js` (新規), `system/manifest.js` (変更), `system/window.js` (変更), `system/system.js` (変更), 各種既存要素・アプリ (変更)

---

## Phase 5: System Services — システムサービス ✅

**目的:** テーマシステム、通知、i18n、設定アプリの基盤サービスを実装する。  
**完了条件:** 組み込み・外部テーマの切替で OS 全体の見た目が即座に変わり、通知が表示・自動消去され、言語切替が反映される。  
**ステータス:** 完了

### `system/theme.js` — テーマエンジン (新規)

**設計基盤:** kitstrap2 の CSS 変数システム上に構築する。`system/main.css` で `--eskit-*` 変数を `var(--kit-*)` にブリッジ済みのため、`--kit-*` 変数を上書きするだけで Shadow DOM を含む全要素に即時反映される。

**テーマオブジェクト形式:**

```json
{
  "id": "catppuccin-mocha",
  "name": "Catppuccin Mocha",
  "dark": true,
  "vars": {
    "--kit-color-primary": "#cba6f7",
    "--kit-fg":            "#cdd6f4",
    "--kit-bg":            "#1e1e2e",
    "--kit-bg-secondary":  "#181825"
  },
  "wallpaper": "linear-gradient(135deg, #1e1e2e, #181825)"
}
```

**API:**

```js
class ESKitTheme {
  get current(): string                // 現在のテーマ ID
  get list(): ThemeMeta[]              // 利用可能なテーマ一覧
  apply(id: string): void              // 組み込みテーマを適用
  applyVars(
    vars: Record<string, string>,
    dark?: boolean
  ): void                              // 変数セットを直接適用 (カスタムテーマ)
  async load(url: string): Promise<ThemeMeta>  // 外部 URL から theme.json を fetch・登録
  reset(): void                        // システムデフォルトに戻す
  setWallpaper(value: string): void    // 壁紙 CSS 値 (url() / gradient)
  export(): string                     // 現在のテーマを JSON 文字列でエクスポート
}
```

- 組み込みテーマ: `system/themes/light.js`, `system/themes/dark.js` という静的 JS モジュールとして定義し、ES Modules の `import` で読み込む（ブート時の fetch を抑え、キャッシュを最大活用）。
- `localStorage` にテーマ ID とカスタム vars を永続化。起動時に自動復元
- 適用時に `system:theme-changed` イベントを発行
- 壁紙: `--eskit-wallpaper` CSS 変数 → `eskit-desktop` の `background` に反映

**外部テーマのインポートフロー (`System.theme.load(url)`):**

1. URL を受け取り `theme.json` を fetch
2. JSON スキーマバリデーション (必須: `id`, `name`, `vars`)
3. ユーザー確認ダイアログ: テーマ名・作者・変更変数数を提示（新設する汎用確認ダイアログ `eskit-dialog` を利用）
4. `applyVars()` で即時適用 → `localStorage` に保存
5. `ThemeMeta` を返却 (リストに追加)

**セキュリティ:**
- HTTPS URL のみ許可 (`http://` は即拒否)
- `vars` のキーは `--kit-*` または `--eskit-*` のみ許可 (任意プロパティ注入を防止)
- 外部テーマ読み込みには設定アプリ経由のユーザー操作を必須とする

### `system/elements/dialog/` (新規)

**ESKitDialogElement (`eskit-dialog`):**
- システム全体で利用できる汎用的な確認・メッセージ用ダイアログ要素。
- Popover API を用いて表示し、テーマのインポート確認やその他のシステム確認処理で再利用する。

### `system/i18n.js` — 多言語対応 (新規)

```js
class ESKitI18n {
  locale: Signal<string>                   // 現在の言語コード（Hamon シグナル）
  async load(lang: string): Promise<void>  // system/i18n/{lang}.json を fetch
  t(key: string, vars?: Record<string, string>): string  // テンプレート補間対応
  get current(): string                    // 現在の言語コード
  get available(): string[]
  extend(appId: string, lang: string, dict: Record<string, string>): void  // アプリ独自辞書マージ
  async loadAppDictionary(appDir: string, appId: string, i18nPath?: string): Promise<void>  // アプリ個別辞書の動的ロード
  getAppName(manifest: Manifest): string   // 多相型マニフェスト名解決
  getAppDescription(manifest: Manifest): string
  getPermissionDescription(permCode: string): string
  formatTime(dateOrTimestamp?: Date|number, options?: Intl.DateTimeFormatOptions): string
  formatDate(dateOrTimestamp?: Date|number, options?: Intl.DateTimeFormatOptions): string
}
```
- コア言語パック: `system/i18n/ja.json`, `system/i18n/en.json` (システム共通・OSメッセージ)
- アプリ個別言語パック: 各アプリの `i18n/{lang}.json` から起動時および言語切替時に動的オンデマンド取得
- `navigator.language` で起動時自動選択 → `localStorage` (`/home/{userId}/.config/i18n.json`) で永続化
- **リアクティブ UI 更新:** `locale` を Hamon のシグナルとして実装し、Hamon テンプレート内の `${() => System.i18n.t('key')}` のように参照することで、言語切替時に依存関係の自動追跡により UI が即座に自動更新される。
- 言語変更完了時には `system:locale-changed` イベントも発行する。

### `system/elements/notification/` (新規)

**ESKitNotificationContainerElement (`eskit-notification-container`):**
- 画面右上固定の通知用コンテナ要素。

**ESKitNotificationElement (`eskit-notification`):**
- `System.events.on("notification:show", handler)` で自動表示され、`eskit-notification-container` 内に順次追加される。
- トーストが縦に積み重なる（スタックする）設計。
- `@starting-style` + `transition` でスライドイン/アウト。
- クリックまたは `duration` 経過で自動的にコンテナから消去される。

### `apps/settings/` — 設定アプリ (新規)

**実装方針:** 新規の Hamon テンプレートエンジンを全面的に使用し、宣言的かつリアクティブに実装する。

タブ構成:
- **外観:** 組み込みテーマ選択グリッド・URL からテーマをインポート (`System.theme.load`)・壁紙グリッド (プリセット + VFS 画像選択 + カスタム壁紙サムネイル)・現在のテーマを JSON でエクスポート
- **言語:** `System.i18n.available` からドロップダウン選択
- **システム:** 実行中プロセス数・登録アプリ数
- **権限:** インストール済みアプリの権限一覧 + 個別取り消し UI

**関連ファイル:** `system/theme.js`, `system/themes/light.js`, `system/themes/dark.js`, `system/i18n.js`, `system/i18n/ja.json`, `system/i18n/en.json`, `system/elements/dialog/`, `system/elements/notification/`, `system/system.js`, `apps/settings/`

---

## Phase 6: PWA & Sample Apps & Base Extensibility — PWA化と拡張基盤 ✅

**目的:** ESKit 本体を PWA 化してオフライン対応・アプリ化を実現し、外部アプリ/テーマのインストール基盤を完成させ、標準サンプルアプリ 4 種を整備し、全システムおよびアプリの完全な多言語対応 (i18n) 基盤を確立する。  
**完了条件:**
1. PWA としてブラウザにインストール可能でオフラインでも動作する。
2. 外部 URL からのアプリ/テーマ登録 (`registerFromUrl`, `theme.load`) が動作し、確認ダイアログが多言語表示される。
3. マニフェスト (`define.json`) が多相型多言語 (`string | { ja, en }`) および辞書パス宣言 (`i18n`) に対応している。
4. 全サンプルアプリ（Notepad, Calculator, Clock, FileManager）が個別辞書 (`apps/*/i18n/`) を備え、ハードコード文字列なしで動作する。
5. 言語切替時にウィンドウタイトル・タスクバー・アプリ内表示が即座に連動更新される。
6. SystemVerifier (`apps/test`) に Phase 6 テストスイートが追加され、全自動検証が PASS する。  
**ステータス:** 完了

### PWA 化仕様
- **キャッシュ戦略:** Network-First (フォールバックで Cache)
  - オンライン時は常に最新リソースを直接取得（開発時の即時反映・キャッシュ事故防止）
  - 通信不可時は Service Worker のキャッシュからレスポンス
- **構成ファイル:**
  - `manifest.webmanifest`: アプリ名、アイコン定義、`display: "standalone"`, `theme_color`, `background_color`
  - `sw.js`: Service Worker (コアシステム、CSS、アイコン、組み込みアプリ、アプリ個別辞書の事前キャッシュ + 動的フェッチキャッシュ)
  - `system/pwa.js`: Service Worker 登録 & 更新監視
  - `icons/`: PWA 用マニフェストアイコン (192x192, 512x512, maskable)

### マニフェスト (`define.json`) 多言語仕様
- **多相型 (Polymorphic) プロパティ:**
  - `name`: `string` または `{ "en": "...", "ja": "..." }`
  - `description`: `string` または `{ "en": "...", "ja": "..." }`
- **辞書パス宣言 (オプション):**
  - `"i18n": "./i18n/"` (未指定時は `./i18n/` をデフォルト探索)

### アプリ個別辞書 & 動的ローダー (`System.i18n.loadAppDictionary`)
- 各アプリディレクトリ配下に `i18n/ja.json`, `i18n/en.json` を配置。
- `System.loadApp()` 時に自動ロードし `System.i18n.extend()` にマージ。
- 言語切替 (`System.i18n.setLocale()`) 時に登録済み・実行中アプリの該当言語辞書を遅延取得・自動マージし、UI を即座にリアクティブ更新。

### `ESKitApp` ウィンドウタイトル自動同期
- アプリが個別タイトル（編集中ファイル名など）を設定しない限り、`ESKitApp` 基底クラスがマニフェストの多言語名（`System.i18n.getAppName`）を自動追従。
- `setTitle(title)` は文字列に加えて Signal や関数・i18n キーを受け入れ可能。
- `app:opened` イベントに `manifest: app._manifest` を含め、タスクバー側でも言語切替時にアプリ表示名を同期更新。

### サンプルアプリ (新規 4 アプリ)

| アプリ | 機能 | 利用 API | 宣言権限 | i18n 辞書 |
|--------|------|---------|---------|----------|
| `apps/notepad/` | テキストエディタ、仮想 FS へ保存/読込 | `this.fs.writeFile/readFile`, `this.showNotification` | `fs.read`, `fs.write`, `notifications` | `apps/notepad/i18n/{ja,en}.json` |
| `apps/calculator/` | 四則演算電卓 (キーボード入力対応) | `this.querySelector` | (なし) | `apps/calculator/i18n/{ja,en}.json` |
| `apps/clock/` | 時計 / ストップウォッチ / タイマー | `this.showNotification`, `System.i18n.formatDate/formatTime` | `notifications` | `apps/clock/i18n/{ja,en}.json` |
| `apps/filemanager/` | 仮想 FS ブラウザ、ファイル作成・削除・リネーム・PC 入出力 | `this.fs.*` 全 API | `fs.read`, `fs.write`, `notifications` | `apps/filemanager/i18n/{ja,en}.json` |

### システムメッセージ & 初期ファイル多言語化
- `system/registry.js`: 外部 URL インストール確認ダイアログを `System.i18n.t()` 化。
- `system/permissions.js`: 権限要求ダイアログのアプリアイコン・名前解決を多言語対応。
- 初期ユーザーディレクトリ作成: `/home/{userId}/desktop/Welcome.txt` および `documents/GettingStarted.md` を日英併記 (Bilingual) で生成。

**関連ファイル:** `manifest.webmanifest`, `sw.js`, `icons/`, `system/manifest.js`, `system/i18n.js`, `system/app.js`, `system/system.js`, `system/permissions.js`, `system/registry.js`, `apps/notepad/`, `apps/calculator/`, `apps/clock/`, `apps/filemanager/`, `apps/test/`

---

## Phase 7: eskpt Registry Service & Client Integration — パッケージマネージャー

**目的:** Void.cloud (`https://void.cloud/`) を活用して ESKit 専用の分散型パッケージレジストリサービス「eskpt」を開発し、ESKit クライアント（ESKish / GUI Store / Web連携）と統合する。  
**完了条件:** 開発者が外部ホスティングしたアプリ/テーマ/CLIを eskpt にインデックス登録でき、ESKish や GUI App Store から検索・1クリックインストールできる。

### 設計方針・決定事項
- **リポジトリ:** `eskpt` (独立リポジトリ, Void.cloud / Vite ベース)
- **インデックス型レジストリ (分散ホスティング):**
  - パッケージ実体（コード・画像・スタイル）は開発者自身の GitHub Pages / Cloudflare Pages / Vercel 等にホスト。
  - eskpt サービスはパッケージのメタデータ（`define.json` / `theme.json`）、バージョン、カテゴリ、検証ステータス、URL をインデックス（Void DB/KV）として管理・検索APIを提供。
  - ホスティングのストレージ負荷や著作権・バイナリ管理の負担を抑え、極めて軽量かつ堅牢なエコシステムを実現。
- **パッケージ種別:**
  1. `app`: ESKit アプリケーション
  2. `theme`: ESKit テーマ
  3. `cli`: ESKish 拡張コマンド
- **ロード方式 (ハイブリッド):**
  - 基本はホスティング URL を `registerFromUrl` で動的 `import()`
  - PWA Service Worker によりキャッシュされ、オフラインでも起動可能

### `eskpt` サービス仕様 (Void.cloud)
- **API エンドポイント:**
  - `GET /api/v1/packages`: パッケージ一覧・カテゴリ別フィルタ
  - `GET /api/v1/packages/:id`: パッケージ詳細・最新バージョン・マニフェスト情報
  - `GET /api/v1/search?q=...`: パッケージ名・キーワード・タグ検索
  - `POST /api/v1/packages`: パッケージ登録・更新リクエスト (URL を送信 → サーバー側でマニフェスト取得・スキーマ検証・インデックス登録)
- **Web UI (Void フロントエンド):**
  - パッケージカタログ・検索画面
  - パッケージ詳細ページ (README, スクリーンショット, 要求権限一覧, 「Install to ESKit」ボタン)
  - パッケージ登録フォーム

### ESKit クライアント統合
1. **ESKish 組み込みコマンド `eskpt`:**
   - `eskpt search <query>`: レジストリを検索
   - `eskpt info <pkgId>`: パッケージ詳細・権限・URL 表示
   - `eskpt install <pkgId|url>`: レジストリから URL を解決して `registerFromUrl` を実行
   - `eskpt uninstall <pkgId>`: インストール済みパッケージを解除
   - `eskpt list`: インストール済みパッケージ一覧
   - `eskpt update [pkgId]`: パッケージの更新チェック・再読み込み
2. **GUI パッケージマネージャーアプリ (`apps/store/`):**
   - Hamon テンプレートで構築された「App Store」風 GUI アプリ
   - おすすめ、カテゴリ別一覧 (アプリ / テーマ / ツール)、検索バー
   - パッケージカード、詳細モーダル、1クリック「インストール」「開く」「アンインストール」ボタン
3. **URL プロトコル・インストール連携:**
   - Web リンクからのインストール受付: `https://eskit.local/?install=<url>` パラメータにより、開いた瞬間にインストール確認ダイアログを自動ポップアップ。

**関連ファイル (ESKit 側):** `apps/eskish/` (eskpt コマンド追加), `apps/store/` (新規 GUI アプリ), `system/system.js` (起動時 install パラメータハンドリング)

---

## Phase 8: Blume Developer Portal & Live Playground — 開発者ポータル

**目的:** Blume (`https://useblume.dev/`) を用いて、ドキュメント・チュートリアル・コンポーネントカタログ・Live Playground・eskpt ショーケースを統合した総合開発者ポータルを構築する。  
**完了条件:** ブラウザ上で ESKit / Hamon アプリをライブ編集・検証できる Playground、および AI 向け `llms.txt`、API リファレンスが完備されたポータルが公開される。

### 設計方針・決定事項
- **リポジトリ:** `eskit-docs` (独立リポジトリ, Blume / Astro + Vite ベース)
- **対象読者:** ESKit を使ってアプリ・テーマを開発したいエンジニア & AI コーディングエージェント

### ポータル構成コンテンツ
1. **開発者ガイド & チュートリアル:**
   - **入門:** ESKit のコンセプト（ビルド不要・ブラウザネイティブ ESM）、クイックスタート
   - **アプリ開発ガイド:** `ESKitApp` ライフサイクル、マニフェスト (`define.json`) 設計、権限モデル
   - **Hamon ガイド:** シグナル (`signal`, `computed`, `effect`)、タグ付きテンプレート (`hamon` タグ)、ディレクティブ (`kit-if`, `list`)、イベント/プロパティバインディング
   - **テーマ・外観ガイド:** kitstrap2 CSS 変数、`theme.json` 作成、Lucide アイコンの利用
   - **配布・公開ガイド:** GitHub Pages へのデプロイと `eskpt` への登録手順
2. **API リファレンス:**
   - コア API (`System.*`, `this.fs.*`, `this.sendMessage`, `this.showNotification` 等) の完全リファレンス
   - Web Components 仕様 (`<eskit-icon>`, `<eskit-dialog>`, `<eskit-window>` 等)
3. **コンポーネントギャラリー (kitstrap2 & Elements):**
   - kitstrap2 のボタンスタイル、フォーム、カード、ダイアログ等のインタラクティブなプレビュー
4. **Live Playground / サンドボックス:**
   - Blume の Astro Islands / iframe 連携を利用し、ブラウザ内で ESKit またはスタンドアロンの Hamon 実行環境を埋め込み
   - 左側にコードエディタ、右側にリアルタイム描画プレビューを配置し、インストール不要でアプリ開発を試作可能に
5. **AI アシスタント & エージェント最適化:**
   - Blume 標準の `llms.txt` / `llms-full.txt` を整備し、Cursor / Gemini / Claude 等の AI エージェントが ESKit アプリコードを一発生成できるようにプロンプト・API 仕様を凝縮配信
   - Blume の「Ask AI」アシスタント有効化
6. **eskpt ショーケース & 1クリックインストール連携:**
   - eskpt レジストリの人気アプリ・テーマをポータル上で紹介
   - 「Install to ESKit」ボタンで、ユーザーの起動中 ESKit インスタンスにダイレクト連携

---

## システムイベント一覧

| イベント | ペイロード | 発行タイミング |
|---------|----------|--------------|
| `system:ready` | — | ブート完了 |
| `system:theme-changed` | `{ id, vars }` | テーマ変更 |
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

## ディレクトリ構成 (完成形 - eskit 本体リポジトリ)

```
index.html
main.js
manifest.webmanifest     (Phase 6 - PWA)
sw.js                    (Phase 6 - PWA Service Worker)
icons/                   (Phase 6 - PWA アイコン)
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
  kitstrap2.js
  kitstrap2.css
  hamon.js
  users.js
  icons.js
  theme.js
  themes/
    light.json
    dark.json
  i18n.js
  i18n/
    ja.json
    en.json
  elements/
    desktop/
    window/
    launcher/
    drawer/
    home-bar/
    permission-dialog/
    taskbar/
    context-menu/
    beacon/
    quick-settings/
    login-screen/
    icon/
    notification/
    dialog/
apps/
  test/                 (SystemVerifier 自動検証スイート)
  welcome/              (ようこそ画面 + i18n/)
  eskish/               (標準ターミナル環境 + i18n/ / Phase 7 で eskpt コマンド統合)
  settings/             (システム設定 + i18n/)
  notepad/              (テキストエディタ + i18n/)
  calculator/           (電卓 + i18n/)
  clock/                (時計/ストップウォッチ/タイマー + i18n/)
  filemanager/          (仮想 FS ブラウザ + i18n/)
  store/                (Phase 7 - eskpt GUI App Store)
```
