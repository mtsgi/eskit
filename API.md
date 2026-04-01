# ESKit API リファレンス

> [← README に戻る](README.md)

---

## `System` (グローバル)

`window.System` としてグローバルに公開される ESKitSystem のインスタンスです。

> **Note (ES Modules):** `index.html` は `type="module"` で動作するため、モジュール内では
> `window.System` / `globalThis.System` を直接参照するか、ファイル先頭で
> `const System = globalThis.System;` を宣言してから使用してください。

```js
const System = globalThis.System;

await System.loadApp("apps/myapp/");         // アプリを起動 → UUID を返す
System.closeApp(uuid);                        // アプリを終了
System.getApp(uuid);                          // アプリインスタンスを取得
System.listProcesses();                       // [{uuid, name, state}, ...]
System.notify({ title, message, duration });  // notification:show イベントを発行 (eskit-notification は Phase 4 で実装予定)
System.sendMessage(targetUuid, data);         // アプリ間 IPC
System.setShellMode("desktop" | "mobile");   // シェルモードを手動切替
System.nextZIndex();                          // フォーカス用 z-index を取得 (呼ぶたびに増加)
System.generateUUID();                        // crypto.randomUUID() のラッパー

// サブシステムへのアクセス
System.events       // ESKitEventBus
System.fs           // ESKitFileSystem
System.registry     // ESKitRegistry
System.permissions  // ESKitPermissions
System.shellMode    // ESKitShellMode
System.WindowSystem // ESKitWindowSystem (ブート後)
```

### `System.ready`

ブート完了を待てる Promise です。`system:ready` イベントが発火するまで解決しません。

```js
await System.ready;
// ブート完了後の処理
```

---

## `System.shellMode` — シェルモード

デスクトップ/モバイルの動作モードを管理する `ESKitShellMode` のインスタンスです。

```js
System.shellMode.current;   // "desktop" | "mobile"
System.shellMode.isDesktop; // boolean
System.shellMode.isMobile;  // boolean
System.shellMode.isLocked;  // boolean — 手動設定中は true、自動検出中は false

System.shellMode.set("mobile"); // 手動でモードを設定 (MediaQuery 自動検出を停止)
System.shellMode.unlock();      // 自動検出を再開し、ビューポートに応じたモードに戻す
```

モード変更時は `"shell:mode-changed"` イベントが発行されます。`System.setShellMode()` は `shellMode.set()` の便利なショートハンドです。

| モード | 説明 |
|--------|------|
| `"desktop"` | 複数ウィンドウのカード形式。タスクバー・ランチャーが表示される |
| `"mobile"` | 1 画面 1 アプリの全画面形式。ホームバー・ドロワーが表示される |

---

## `System.WindowSystem` — シェル UI 要素

ウィンドウとシェル要素を管理する `ESKitWindowSystem` のインスタンスです。ブート完了後にアクセスできます。

```js
System.WindowSystem.activeUuid;      // 現在フォーカス中のウィンドウ UUID
System.WindowSystem.getElement(uuid); // UUID から eskit-window 要素を取得
System.WindowSystem.activateWindow(uuid); // ウィンドウをアクティブにする (desktop: 最前面 / mobile: 全画面)
System.WindowSystem.getAllElements(); // 全ウィンドウ要素の配列
```

### シェル UI 要素へのアクセス

| プロパティ | 要素 | 説明 |
|-----------|------|------|
| `WindowSystem.contextMenu` | `<eskit-context-menu>` | 右クリックコンテキストメニュー |
| `WindowSystem.beacon` | `<eskit-beacon>` | グローバル検索オーバーレイ |
| `WindowSystem.quickSettings` | `<eskit-quick-settings>` | クイック設定パネル |
| `WindowSystem.taskbar` | `<eskit-taskbar>` | タスクバー (desktop のみ) |
| `WindowSystem.launcher` | `<eskit-launcher>` | ランチャー (desktop のみ) |
| `WindowSystem.drawer` | `<eskit-drawer>` | アプリドロワー (mobile のみ) |
| `WindowSystem.homeBar` | `<eskit-home-bar>` | ホームバー (mobile のみ) |

### `ESKitContextMenuElement`

```js
const cm = System.WindowSystem.contextMenu;

cm.show(x, y, items); // 座標 (clientX/Y) 指定でメニューを表示
cm.hide();            // メニューを閉じる

// items の形式:
// { label: string, action: () => void, icon?: string }
// { separator: true }
```

- Popover API (`popover="manual"`) で表示。画面端を自動補正して位置調整します。
- 外側クリック / Escape キーで自動的に閉じます。

### `ESKitBeaconElement` — グローバル検索

```js
const beacon = System.WindowSystem.beacon;

beacon.show();   // 検索オーバーレイを開く
beacon.hide();   // 閉じる
beacon.toggle(); // 開閉トグル
```

- `Ctrl+Space` / `Cmd+Space` でグローバルに toggle されます。
- `System.registry.search(query)` でアプリをリアルタイム検索。
- `↑` / `↓` キーで候補選択、`Enter` で起動、`Escape` で閉じます。

### `ESKitQuickSettingsElement`

```js
const qs = System.WindowSystem.quickSettings;

qs.show();   // パネルを開く
qs.hide();   // 閉じる
qs.toggle(); // 開閉トグル
```

- タスクバーの時計クリックで呼び出されます。
- モバイルモードではドロワー上部の ⚙️ ボタンからも開けます。
- モバイル時は画面上部に全幅で表示されます。

---

## `ESKitWindowElement` — アプリウィンドウ

すべてのアプリウィンドウは `<eskit-window>` カスタム要素で管理されます。`ESKitApp._windowElement` から参照できます。

### ウィンドウ操作

```js
const win = app._windowElement;

win.focus();         // ウィンドウを最前面にフォーカスする
win.minimize();      // 最小化
win.maximize();      // 最大化
win.restore();       // 通常状態に復元 (最小化・最大化・スナップから)
win.snap("left");    // 画面左半分にスナップ
win.snap("right");   // 画面右半分にスナップ
win.setTitle(title); // タイトルバーのテキストを更新
```

### 状態・属性

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `win._state` | `"normal"\|"minimized"\|"maximized"` | 現在のウィンドウ状態 |
| `win._prevRect` | `{left, top, width, height}\|null` | 最大化・スナップ前の位置とサイズ |

| 属性 | 説明 |
|------|------|
| `mode="desktop"\|"mobile"` | シェルモードに連動して自動更新 |
| `active` | mobile モードで全画面表示するとき付与 |

### ドラッグ・リサイズ

- **ドラッグ:** タイトルバー (`.app-header`) を掴んでウィンドウを移動。最大化中はドラッグ不可。
- **タイトルバーダブルクリック:** 最大化 / 復元トグル。
- **リサイズ:** 8 方向ハンドル (N/S/E/W/NE/NW/SE/SW) でリサイズ。最小サイズ: 幅 220px / 高さ 120px。
- **スナッププレビュー:** ドラッグ中に画面端に近づくと半透明のプレビューを表示。`pointerup` 時にスナップを確定。
  - 上端 (y ≤ 8px) → `maximize()`
  - 左端 (x ≤ 8px) → `snap("left")`
  - 右端 (x ≥ innerWidth - 8px) → `snap("right")`

---

## `System.fs` — 仮想ファイルシステム

IndexedDB 上に実装されたファイルシステム (`ESKitFileSystem`) です。

### 書き込み

```js
// テキスト
await System.fs.writeFile("/home/user/note.txt", "Hello, ESKit!");

// バイナリ (Uint8Array)
await System.fs.writeFile("/home/user/icon.png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...]));

// ArrayBuffer
await System.fs.writeFile("/home/user/data.bin", arrayBuffer);

// Blob
await System.fs.writeFile("/home/user/file.dat", blob);
```

`writeFile` はすべての入力値を内部的に `Uint8Array` に変換して保存します。親ディレクトリが存在しない場合は自動作成されます。

### 読み込み

```js
// テキストとして読む (UTF-8 デコード)
const text  = await System.fs.readFile("/home/user/note.txt");

// バイナリ (Uint8Array) として読む
const bytes = await System.fs.readFileAsBytes("/home/user/icon.png");
```

### ディレクトリ操作

```js
await System.fs.mkdir("/home/user/docs", { recursive: true });

const entries = await System.fs.readdir("/home/user");
// → [{ name: "docs", type: "dir", path: "/home/user/docs" }, ...]
```

### ファイル情報・存在確認

```js
const stat   = await System.fs.stat("/home/user/note.txt");
// → { path, type: "file"|"dir", size: number, createdAt: number, modifiedAt: number }

const exists = await System.fs.exists("/home/user/note.txt"); // boolean
```

### 削除・リネーム

```js
await System.fs.remove("/home/user/note.txt");
await System.fs.remove("/home/user/docs", { recursive: true });

await System.fs.rename("/home/user/old.txt", "/home/user/new.txt");
```

### 初期ディレクトリ

ESKit が起動時に自動作成するディレクトリ:

| パス | 用途 |
|------|------|
| `/home/user` | ユーザーホームディレクトリ |
| `/home/user/desktop` | デスクトップ |
| `/system` | システムファイル |
| `/apps` | アプリ配置領域 |

---

## `System.events` — イベントバス

アプリ・システム間の通信に使用する pub/sub バス (`ESKitEventBus`) です。

```js
// 永続購読 (返値 = 購読解除関数)
const off = System.events.on("app:opened", ({ uuid, name }) => { ... });
off(); // 購読解除

// 一度だけ受信
System.events.once("system:ready", () => { ... });

// 手動購読解除
System.events.off("my-event", handler);

// 発行
System.events.emit("my-event", { data: 123 });
```

### システムイベント一覧

| イベント | ペイロード | 発行タイミング |
|---------|----------|--------------|
| `system:ready` | — | ブート完了 |
| `system:theme-changed` | `{name}` | テーマ変更 |
| `system:locale-changed` | `{lang}` | 言語変更 |
| `app:opened` | `{uuid, name}` | アプリ起動 |
| `app:closed` | `{uuid}` | アプリ終了 |
| `app:focused` | `{uuid}` | ウィンドウフォーカス変更 |
| `app:titleChanged` | `{uuid, title}` | タイトル変更 |
| `notification:show` | `{title?, message?, duration?}` | 通知表示 |
| `launcher:toggle` | — | ランチャー開閉 |
| `shell:mode-changed` | `{mode, prev}` | desktop/mobile モード切替 |
| `drawer:open` | — | ドロワーが開かれた |
| `drawer:close` | — | ドロワーが閉じられた |

---

## `System.registry` — アプリレジストリ

```js
// define.json からアプリを登録
const manifest = await System.registry.register("apps/myapp/");

// Manifest を手動で登録 (外部アプリインストール等)
System.registry.registerManual(id, manifest, dir?);

// 登録を解除する
System.registry.unregister(id);

// ID で Manifest を取得
const manifest = System.registry.get(id);           // Manifest | null

// ディレクトリで Manifest を取得
const manifest = System.registry.getByDir(appDir);  // Manifest | null

// 登録済みアプリ一覧 (各オブジェクトに _dir プロパティを付与)
const apps = System.registry.list();
// → [{ id, name, entry, version, description, permissions, icon, _dir }, ...]

// 検索 (name / description / id に対してあいまい検索)
const results = System.registry.search("notepad");

// 外部 URL からインストール (Phase 5)
await System.registry.registerFromUrl("https://example.com/myapp/");
```

---

## `System.permissions` — 権限マネージャー

通常はシステムが自動的に呼び出しますが、アプリから直接使用することもできます。

```js
// Install-time チェック (同期): マニフェストに宣言されているか
System.permissions.isDeclared(uuid, "fs.read"); // boolean

// Runtime チェック (非同期): 実際の許可状態を確認 (必要に応じてダイアログ)
const granted = await System.permissions.check(uuid, "notifications");

// 権限を明示的に許可 / 拒否し localStorage に永続化する
System.permissions.grant(uuid, "fs.read");         // 許可
System.permissions.grant(uuid, "fs.read", false);  // 拒否 (第 3 引数)
System.permissions.deny(uuid, "fs.read");          // 拒否のショートハンド

// アプリ終了時にセッションエントリをクリア (localStorage は維持)
System.permissions.revoke(uuid);
```

---

## `ESKitApp` — アプリ基底クラス

すべての ESKit アプリはこのクラスを継承します。

### アプリの定義パターン

```js
import ESKitApp from "system/app.js";
import { html, css } from "system/util.js";

export default class MyApp extends ESKitApp {
  // static プロパティでテンプレートとスタイルを宣言する (推奨)
  static template = html`
    <h1>Hello, ESKit!</h1>
    <button id="btn">Click me</button>
  `;

  static style = css`
    h1 { color: var(--kit-color-primary); }
  `;

  initialize() {
    // _uuid, _windowElement が注入された後に呼ばれる
    this.querySelector("#btn").addEventListener("click", () => {
      this.setTitle("Clicked!");
    });
  }

  close() {
    // クリーンアップ (タイマー停止など)
  }
}

### ライフサイクルフック

| フック | 呼ばれるタイミング |
|--------|----------------|
| `initialize()` | `_uuid`, `_windowElement` 注入後 |
| `close()` | アプリ終了直前 |
| `onFocus()` | ウィンドウがフォーカスされた |
| `onBlur()` | ウィンドウのフォーカスが外れた |
| `onResize(w, h)` | ウィンドウがリサイズされた |
| `onMinimize()` | ウィンドウが最小化された |
| `onRestore()` | ウィンドウが復元された |
| `onMessage(data)` | `System.sendMessage()` で送信されたデータを受信 |

### 開発者 API

```js
this.setTitle(title)                  // ウィンドウタイトルを変更
this.querySelector(selector)          // Shadow DOM 内の要素を取得
this.querySelectorAll(selector)       // Shadow DOM 内の要素を全取得
await this.showNotification(opts)     // 通知 (permissions: "notifications" が必要)
```

### プロパティ

| プロパティ | 説明 |
|----------|------|
| `this.name` | アプリ表示名 (コンストラクタクラス名、または `setTitle()` で変更) |
| `this._uuid` | アプリ固有の UUID |
| `this._manifest` | `define.json` から読み込まれた Manifest |
| `this._state` | `"running"`, `"minimized"`, `"maximized"`, `"closed"` |
| `this._windowElement` | 対応する `<eskit-window>` 要素 |

---

## 権限モデル

ESKit は iOS / Android と同様の 2 段階権限モデルを採用しています。

```
Install-time チェック (define.json の permissions[] 宣言)
  → 宣言あり → Runtime チェック
                 → localStorage に許可記録あり → 即許可
                 → 初回アクセス               → Popover ダイアログでユーザー確認
                                                 → 許可 / 拒否 を localStorage に記録
  → 宣言なし → 即拒否 (例外なし)
```

### 利用可能な権限

| 権限 | 説明 |
|------|------|
| `fs.read` | 仮想ファイルシステムの読み取り (`readFile`, `readFileAsBytes`, `readdir`, `stat`, `exists`) |
| `fs.write` | 仮想ファイルシステムへの書き込み (`writeFile`, `mkdir`, `remove`, `rename`) |
| `notifications` | 通知の表示 (`System.notify`, `this.showNotification`) |
| `ipc` | 他のアプリへのメッセージ送信 (`System.sendMessage`) |
| `network` | 外部 URL への fetch |
| `system.info` | システム情報の取得 (`System.listProcesses`) |
| `clipboard` | クリップボードへのアクセス (`navigator.clipboard.*`) |

---

## 外部アプリのインストール (Phase 5)

URL を指定してサードパーティアプリをインストールできます。

```js
await System.registry.registerFromUrl("https://example.com/myapp/");
```

**インストールフロー:**
1. `{url}/define.json` を fetch してマニフェストを取得・バリデーション
2. Popover ダイアログでユーザーに **アプリ名・バージョン・要求権限** を提示
3. ユーザーが承認 → 動的 `import()` でエントリポイントをロード
4. localStorage に登録情報を永続化 → 次回起動時に自動復元

**制限:**
- HTTPS URL のみ許可（http:// は拒否）
- `network` 権限を宣言していないアプリが外部 fetch を行うと拒否

---

## `define.json` — アプリマニフェスト

各アプリのルートディレクトリに配置する JSON ファイルです。

```json
{
  "id":          "com.example.myapp",
  "name":        "My App",
  "entry":       "main.js",
  "version":     "1.0.0",
  "description": "アプリの説明",
  "icon":        "icon.png",
  "permissions": ["fs.read", "notifications"]
}
```

| フィールド | 必須 | 説明 |
|---------|------|------|
| `id` | ✅ | 一意なリバースドメイン形式の ID |
| `name` | ✅ | 表示名 |
| `entry` | ✅ | エントリポイント JS ファイル名 |
| `version` | — | バージョン文字列 (省略時 `"0.0.1"`) |
| `description` | — | アプリの説明 |
| `icon` | — | アイコン画像のファイル名 |
| `permissions` | — | 要求権限の配列 |

---

## Hamon — リアクティブテンプレートエンジン

`system/hamon.js` — シグナル方式のリアクティビティ (VDOM なし) でアプリ UI を宣言的に構築する。

```js
import hamon, { signal, computed, effect, list, isSignal, HamonScope } from "system/hamon.js";
```

### signal(initial)

リアクティブな値を作成する。

```js
const count = signal(0);
count.value;      // 0 — get (実行中 effect があれば依存登録)
count.value = 1;  // set — 依存する全 effect が再実行される
count.peek();     // 1 — 依存追跡なしで現在値を読む
```

### computed(fn)

読み取り専用の派生シグナル。依存元が変化すると自動再計算される。

```js
const count  = signal(3);
const double = computed(() => count.value * 2);
double.value; // 6
count.value = 5;
double.value; // 10
```

### effect(fn)

副作用を登録する。依存シグナルが変化すると自動再実行。`fn` が関数を返した場合、次回再実行前にクリーンアップとして呼ばれる。

```js
const dispose = effect(() => {
  console.log("count =", count.value);
  return () => console.log("cleanup");
});
dispose(); // 手動で解除
```

### isSignal(v)

引数が Signal オブジェクトかどうかを判定する。

```js
isSignal(signal(0)); // true
isSignal(42);        // false
```

### hamon\`...\`

リアクティブな `DocumentFragment` を返すタグ付きテンプレートリテラル。

```js
const count = signal(0);
const fragment = hamon`
  <button @click=${() => count.value++}>
    Count: ${() => count.value}
  </button>
`;
```

返却される `fragment` は通常の `DocumentFragment` に `_scope: HamonScope` プロパティが付与されている。`_scope.dispose()` で全バインディングを一括解除できる。

#### テキスト補間

| 構文 | 挙動 |
|------|------|
| `${value}` | 静的値をそのまま Text ノードとして挿入 |
| `${() => expr}` | effect で自動更新。戻り値が Node/Fragment なら DOM 挿入 |
| `${signalObj}` | Signal の `.value` を effect でバインド |

#### イベントバインディング `@event`

```html
<button @click=${handler}>...</button>
<input @input=${(e) => name.value = e.target.value}>
```

scope dispose 時に `removeEventListener` が自動呼び出しされる。

#### 属性バインディング `:attr`

```html
<input :value=${() => name.value} :disabled=${() => locked.value}>
<div :class=${() => active.value ? "on" : "off"}>
```

| 属性名 | 設定方式 |
|--------|---------|
| `value`, `checked`, `selected`, `disabled` | DOM プロパティ直接設定 (`el[attr] = v`) |
| その他 | `setAttribute` / `removeAttribute` |

`false` / `null` を設定すると属性が除去される。`true` は空文字属性 (`attr=""`) になる。

#### `kit-if` / `kit-else` 条件分岐

```js
const show = signal(true);
hamon`
  <div kit-if=${() => show.value}>表示される</div>
  <div kit-else>非表示のとき表示</div>
`;
```

- Comment ノードをアンカーとして位置を記憶
- 条件の真偽で要素を DOM に挿入/除去 (ノード実体は保持し再生成しない)
- `kit-else` は直前の `kit-if` 要素の次の兄弟要素として連動する

### list(itemsFn, renderFn)

リスト描画ヘルパー。テキスト補間内で使用する。

```js
const items = signal(["Apple", "Banana", "Cherry"]);
const fragment = hamon`
  <ul>
    ${list(() => items.value, (item, i) => hamon`<li>${item}</li>`)}
  </ul>
`;
```

- `itemsFn` — 配列を返す関数 (Signal に依存可能)
- `renderFn(item, index)` — 各アイテムの DOM を返す関数。`hamon` タグ関数、DOM ノード、文字列のいずれかを返せる
- 配列が変化するとリスト全体が再レンダリングされる。各アイテムの `_scope` は再レンダリング時に自動 dispose

### HamonScope

Effect のライフサイクルスコープ。アプリ終了時にまとめて dispose するために使用する。

```js
const scope = new HamonScope();
const count = scope.signal(0);
scope.effect(() => console.log(count.value));
scope.onDispose(() => { /* 任意のクリーンアップ */ });
scope.dispose(); // スコープ内の全 effect を一括解除
```

| メソッド | 説明 |
|---------|------|
| `signal(v)` | `signal(v)` のエイリアス |
| `computed(fn)` | `computed(fn)` のエイリアス |
| `effect(fn)` | effect を作成し dispose を追跡する |
| `onDispose(fn)` | dispose 時に呼ばれるコールバックを追加 |
| `dispose()` | 全 effect・コールバックを一括解除 |

### ESKitApp との統合

`ESKitApp` 基底クラスに `hamon` ゲッターが追加されており、アプリ専用の `HamonScope` を利用できる。

```js
import ESKitApp from "system/app.js";
import hamon, { signal } from "system/hamon.js";

export default class MyApp extends ESKitApp {
  constructor() {
    super();
    const count = this.hamon.signal(0);
    this.template = hamon`
      <button @click=${() => count.value++}>
        Count: ${() => count.value}
      </button>
    `;
  }
}
```

- `this.hamon` は `HamonScope` インスタンスを遅延生成して返す
- テンプレートに `DocumentFragment` を設定すると、ウィンドウシステムが自動判定して DOM 挿入する
- アプリ終了時 (`closeApp`) に `_hamonScope.dispose()` が自動呼び出しされ、全 effect が解除される
