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

## 現状 (Phase 1～3.5 実装済み)

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
| `system/elements/launcher/` | `eskit-launcher` — デスクトップモード用ランチャー (グリッド UI + 検索) |
| `system/elements/taskbar/` | `eskit-taskbar` — デスクトップモード用タスクバー (ランチャーボタン・アプリ一覧・時計) |
| `system/elements/drawer/` | `eskit-drawer` — モバイル用アプリドロワー |
| `system/elements/home-bar/` | `eskit-home-bar` — モバイル用ホームバー |
| `system/elements/permission-dialog/` | `eskit-permission-dialog` — 権限確認ダイアログ (Web Component) |
| `apps/test/` | SystemVerifier — システム検証アプリ |
| `apps/welcome/` | WelcomeApp — ようこそ画面 |
| `README.md` | 日本語 README |
| `API.md` | API リファレンス (README から分離) |
| `system/kitstrap2.js` | Singleton CSSStyleSheet — kitstrap2 を Shadow DOM 全体に共有 |
| `system/kitstrap2.css` | kitstrap2 CSS フレームワーク本体 |
| `system/main.css` | `--eskit-*` → `var(--kit-*)` CSS 変数ブリッジ |
| `system/elements/context-menu/` | `eskit-context-menu` — 右クリックコンテキストメニュー (Phase 3) |
| `system/elements/beacon/` | `eskit-beacon` — グローバル検索オーバーレイ (Phase 3) |
| `system/elements/quick-settings/` | `eskit-quick-settings` — クイック設定パネル (Phase 3) |
| `system/hamon.js` | Hamon — リアクティブテンプレートエンジン (Phase 3.5) |

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

## Phase 4: Multi-User Foundation — ユーザー概念導入

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

## Phase 5: System Services — システムサービス

**目的:** テーマシステム、通知、i18n、設定アプリの基盤サービスを実装する。  
**完了条件:** 組み込み・外部テーマの切替で OS 全体の見た目が即座に変わり、通知が表示・自動消去され、言語切替が反映される。

### `system/theme.js` — テーマエンジン (新規)

**設計基盤:** kitstrap2 の CSS 変数システム上に構築する。`system/main.css` で `--eskit-*` 変数を `var(--kit-*)` にブリッジ済みのため、`--kit-*` 変数を上書きするだけで Shadow DOM を含む全要素に即時反映される。

**テーマオブジェクト形式:**

```json
{
  "id": "catppuccin-mocha",
  "name": "Catppuccin Mocha",
  "author": "Catppuccin",
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
  extend(appId: string, lang: string, dict: Record<string, string>): void  // アプリ独自辞書
}
```
- 言語パック: `system/i18n/ja.json`, `system/i18n/en.json`
- `navigator.language` で起動時自動選択 → `localStorage` でオーバーライド可
- **リアクティブ UI 更新:** `locale` を Hamon のシグナルとして実装し、Hamon テンプレート内の `${() => System.i18n.t('key')}` のように参照することで、言語切替時に依存関係の自動追跡により UI が即座に自動更新される。
- 言語変更の完了時には `system:locale-changed` イベントも発行する。

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
- **外観:** 組み込みテーマ選択グリッド・URL からテーマをインポート (`System.theme.load`)・壁紙グリッド (6 種)・現在のテーマを JSON でエクスポート
- **言語:** `System.i18n.available` からドロップダウン選択
- **システム:** 実行中プロセス数・登録アプリ数
- **権限:** インストール済みアプリの権限一覧 + 個別取り消し UI

**関連ファイル:** `system/theme.js`, `system/themes/light.js`, `system/themes/dark.js`, `system/i18n.js`, `system/i18n/ja.json`, `system/i18n/en.json`, `system/elements/dialog/`, `system/elements/notification/`, `system/system.js`, `apps/settings/`

---

## Phase 6: Developer Experience & Apps — 開発者体験とサンプルアプリ

**目的:** アプリ開発の実例を示し、外部アプリインストール機能を実装し、ドキュメントを整備する。  
**完了条件:** ドキュメントだけ読んで新規アプリを作成・登録でき、外部 URL からアプリをインストールできる。

### サンプルアプリ (新規 4 アプリ)

| アプリ | 機能 | 利用 API | 宣言権限 |
|--------|------|---------|---------|
| `apps/notepad/` | テキストエディタ、仮想 FS へ保存/読込 | `this.fs.writeFile/readFile`, `this.showNotification` | `fs.read`, `fs.write`, `notifications` |
| `apps/calculator/` | 四則演算電卓 | `this.querySelector` | (なし) |
| `apps/clock/` | 時計 / ストップウォッチ / タイマー | `close()` で interval 解除、`this.showNotification` | `notifications` |
| `apps/filemanager/` | 仮想 FS ブラウザ、ファイル作成・削除・リネーム | `this.fs.*` 全 API | `fs.read`, `fs.write` |

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
  kitstrap2.js          (実装済み)
  kitstrap2.css         (実装済み)
  hamon.js              (Phase 3.5)
  users.js              (Phase 4)
  theme.js              (Phase 5)
  themes/               (Phase 5)
    light.json
    dark.json
  i18n.js               (Phase 5)
  i18n/
    ja.json             (Phase 5)
    en.json             (Phase 5)
  elements/
    desktop/
    window/
    launcher/
    drawer/
    home-bar/
    permission-dialog/
    taskbar/            (実装済み)
    context-menu/       (Phase 3)
    beacon/             (Phase 3)
    quick-settings/     (Phase 3)
    login-screen/       (Phase 4)
    notification/       (Phase 5)
apps/
  test/
  welcome/
  settings/             (Phase 5)
  notepad/              (Phase 6)
  calculator/           (Phase 6)
  clock/                (Phase 6)
  filemanager/          (Phase 6)
```
