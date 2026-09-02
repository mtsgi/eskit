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
System.listProcesses();                       // [{uuid, name, icon, state}, ...]
System.notify({ title, message, duration });  // notification:show イベントを発行
System.sendMessage(targetUuid, data);         // アプリ間 IPC
System.setShellMode("desktop" | "mobile" | "auto"); // シェルモード切替 ("auto" で自動検出復帰)
System.nextZIndex();                          // フォーカス用 z-index を取得 (呼ぶたびに増加)
System.generateUUID();                        // crypto.randomUUID() のラッパー
System.currentUser;                           // 現在ログイン中ユーザー ({id, name, isAdmin, createdAt} | null)
System.homeDir();                             // 現在ユーザーのホームパス (例: "/home/alice")
System.homeDir("bob");                        // 指定ユーザーのホームパス
System.logout();                              // ログアウトしてログイン画面に戻る

// サブシステムへのアクセス
System.events        // ESKitEventBus
System.fs            // ESKitFileSystem
System.registry      // ESKitRegistry
System.permissions   // ESKitPermissions
System.users         // ESKitUsers
System.shellMode     // ESKitShellMode
System.icons         // ESKitIcons
System.theme         // ESKitTheme (Phase 5)
System.i18n          // ESKitI18n (Phase 5)
System.dialog        // ESKitDialogElement ファサード (Phase 5)
System.notifications // ESKitNotificationsStore (Phase 5)
System.WindowSystem  // ESKitWindowSystem (ブート後)
```

### `System.ready`

ブート完了を待てる Promise です。`system:ready` イベントが発火するまで解決しません。

```js
await System.ready;
console.log(System.currentUser); // { id, name, isAdmin, createdAt }
```

---

## `System.users` — ユーザー / セッション

ユーザー管理とログインセッションを扱う `ESKitUsers` インスタンスです。

```js
System.users.hasUsers();
System.users.list();
System.users.getCurrent();

await System.users.create({
  id: "alice",
  name: "Alice",
  password: "password123",
  isAdmin: false,
});

await System.users.login("alice", "password123");
await System.users.delete("alice");
System.users.logout();
```

### ユーザー仕様

- ユーザー ID は英小文字で始まる 1〜31 文字（英小文字・数字・`_`・`-`）です
- 初回起動時は管理者ユーザー作成が必須です
- `isAdmin: true` での作成および `delete()` による削除は管理者ユーザーのみ実行可能です（特権昇格・不正削除防止）
- セッションは `localStorage` に保持されます
- パスワードは PBKDF2 (SHA-256) でハッシュ化して保存されます
- 最後の管理者ユーザーは削除できません

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

モード変更時は `"shell:mode-changed"` イベントが発行されます。`System.setShellMode()` は `shellMode.set()` / `shellMode.unlock()` ("auto" 指定時) の便利なショートハンドです。

| モード | 説明 |
|--------|------|
| `"desktop"` | 複数ウィンドウのカード形式。タスクバー・ランチャーが表示される |
| `"mobile"` | 1 画面 1 アプリの全画面形式。ホームバー・ドロワーが表示される |

---

## `System.icons` — アイコンレジストリ & `<eskit-icon>`

アイコンセット（Icon Set）を管理し、SVG アイコンを描画する `ESKitIcons` インスタンスおよび Web Component です。

```js
// アイコンの存在確認と SVG 内部コンテンツ取得
System.icons.has("lucide", "search");  // true
System.icons.get("lucide", "search");  // '<circle cx="11" cy="11" r="8"/>...'

// アイコンセット一覧とアイコン一覧
System.icons.listSets();               // ["lucide"]
System.icons.listIcons("lucide");      // ["minus", "square", "search", ...]

// 独自アイコンセットの登録 (アプリ・プラグイン拡張)
System.icons.registerSet("my-icons", {
  "custom-star": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
});

// マニフェスト icon 定義から DOM 要素を生成
const appIcon = System.icons.createAppIcon(manifest.icon, { size: 24 });
```

### `<eskit-icon>` Web Component

```html
<eskit-icon set="lucide" name="search" size="18"></eskit-icon>
<eskit-icon set="lucide" name="x" size="14" stroke-width="2.5" color="#ef4444"></eskit-icon>
```

| 属性 | 型 | デフォルト | 説明 |
|------|----|-----------|------|
| `set` | string | `"lucide"` | アイコンセット名 |
| `name` | string | (必須) | アイコン名 |
| `size` | string/number | `1em` | サイズ（数値の場合は `px` 単位） |
| `stroke-width` | string/number | `2` | 線の太さ |
| `color` | string | `currentColor` | アイコン色 |

### `icon(set, name, options)` ヘルパー関数

Hamon テンプレートや動的 DOM 構築で利用できるヘルパー関数です。`<eskit-icon>` DOM 要素を返します。

```js
import { icon } from "system/icons.js";

// Hamon テンプレート内
const template = hamon`
  <button class="kit-button">
    ${icon("lucide", "sparkles", { size: 16 })}
    <span>クリック</span>
  </button>
`;
```

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

> **Note (アプリ開発者向け):** `System.fs` はカーネル内部・シェル要素・管理者用です。一般アプリからは直接呼び出さず、2 段階権限モデルと連動する `this.fs` (ESKitApp ファサード) を使用してください。

### パス規約

- ユーザーホーム: `/home/{userId}`
- 共有領域: `/shared`
- システム領域: `/system`, `/apps`
- 便利メソッド: `System.homeDir()` で現在ユーザーのホームパスを取得可能

### 書き込み

```js
const home = System.homeDir();

// テキスト
await System.fs.writeFile(`${home}/note.txt`, "Hello, ESKit!");

// バイナリ (Uint8Array)
await System.fs.writeFile(`${home}/icon.png`, new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...]));

// ArrayBuffer
await System.fs.writeFile(`${home}/data.bin`, arrayBuffer);

// Blob
await System.fs.writeFile(`${home}/file.dat`, blob);
```

`writeFile` はすべての入力値を内部的に `Uint8Array` に変換して保存します。親ディレクトリが存在しない場合は自動作成されます。

### 読み込み

```js
const home = System.homeDir();

// テキストとして読む (UTF-8 デコード)
const text  = await System.fs.readFile(`${home}/note.txt`);

// バイナリ (Uint8Array) として読む
const bytes = await System.fs.readFileAsBytes(`${home}/icon.png`);
```

### ディレクトリ操作

```js
const home = System.homeDir();
await System.fs.mkdir(`${home}/docs`, { recursive: true });

const entries = await System.fs.readdir(home);
// → [{ name: "docs", type: "dir", path: "/home/alice/docs" }, ...]
```

### ファイル情報・存在確認

```js
const home = System.homeDir();
const stat = await System.fs.stat(`${home}/note.txt`);
// → {
//      path,
//      type: "file"|"dir",
//      size: number,
//      owner: string,
//      mode: {
//        owner:  { read: boolean, write: boolean },
//        others: { read: boolean, write: boolean }
//      },
//      createdAt: number,
//      modifiedAt: number
//    }

const exists = await System.fs.exists(`${home}/note.txt`); // boolean
```

### `mode`

```js
{
  owner:  { read: true, write: true },
  others: { read: false, write: false }
}
```

- `owner.read / owner.write`: 所有者の読み書き可否
- `others.read / others.write`: 非所有者の読み書き可否

### 削除・リネーム

```js
const home = System.homeDir();

await System.fs.remove(`${home}/note.txt`);
await System.fs.remove(`${home}/docs`, { recursive: true });

await System.fs.rename(`${home}/old.txt`, `${home}/new.txt`);
```

### 初期ディレクトリ

ESKit が起動時に自動作成するディレクトリ:

| パス | 用途 |
|------|------|
| `/home` | ユーザーホームのルート |
| `/home/{userId}` | ユーザーホームディレクトリ |
| `/home/{userId}/desktop` | デスクトップ |
| `/shared` | 共有領域 |
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
System.events.once("system:ready", ({ user }) => { ... });

// 手動購読解除
System.events.off("my-event", handler);

// 発行
System.events.emit("my-event", { data: 123 });
```

### システムイベント一覧

| イベント | ペイロード | 発行タイミング |
|---------|----------|--------------|
| `system:ready` | `{user}` | ブート完了 |
| `system:theme-changed` | `{name}` | テーマ変更 |
| `system:locale-changed` | `{lang}` | 言語変更 |
| `user:created` | `{user}` | ユーザー作成 |
| `user:logged-in` | `{user}` | ログイン完了 |
| `user:logged-out` | `{user}` | ログアウト |
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

// 外部 URL からインストール (Phase 6)
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

// 権限を明示的に許可 / 拒否し localStorage に永続化する (UUID または App ID)
System.permissions.grant(appId, "fs.read");         // 許可
System.permissions.grant(appId, "fs.read", false);  // 拒否 (第 3 引数)
System.permissions.deny(appId, "fs.read");          // 拒否のショートハンド

// 個別権限の取り消し (次回アクセス時に再確認を要求)
System.permissions.revokePermission(appId, "fs.read");

// アプリの全権限を取り消し
System.permissions.revokeAll(appId);

// 権限状態の取得 ("granted" | "denied" | "unprompted")
const state = System.permissions.getPermissionState(appId, "fs.read");

// アプリ終了時にセッションエントリをクリア (localStorage は維持)
System.permissions.revoke(uuid);
```

権限の永続化キーはユーザー単位で分離されます（同じアプリでもログインユーザーごとに許可状態が独立します）。

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
await this.sendMessage(targetUuid, data) // IPC 送信 (permissions: "ipc" が必要)
await this.listProcesses()            // プロセス一覧取得 (permissions: "system.info" が必要)

// 仮想ファイルシステムファサード (マニフェストの permissions と連動)
await this.fs.readFile(path)          // 読み取り (permissions: "fs.read" が必要)
await this.fs.readFileAsBytes(path)   // バイナリ読み取り (permissions: "fs.read" が必要)
await this.fs.readdir(path)           // 一覧 (permissions: "fs.read" が必要)
await this.fs.stat(path)              // 情報取得 (permissions: "fs.read" が必要)
await this.fs.exists(path)            // 存在確認 (permissions: "fs.read" が必要)
await this.fs.writeFile(path, data)   // 書き込み (permissions: "fs.write" が必要)
await this.fs.mkdir(path, opts)       // ディレクトリ作成 (permissions: "fs.write" が必要)
await this.fs.remove(path, opts)      // 削除 (permissions: "fs.write" が必要)
await this.fs.rename(oldPath, newPath)// リネーム/移動 (permissions: "fs.write" が必要)
```

### プロパティ

| プロパティ | 説明 |
|----------|------|
| `this.name` | アプリ表示名 (コンストラクタクラス名、または `setTitle()` で変更) |
| `this.manifest` | 読み取り専用・イミュータブルな `Manifest` オブジェクト |
| `this._uuid` | アプリ固有の UUID |
| `this._manifest` | `define.json` から読み込まれた Manifest (内部用) |
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
| `fs.read.all` | 管理者向け: 他ユーザー領域を含む広域読み取り |
| `fs.write.all` | 管理者向け: 他ユーザー領域を含む広域書き込み |
| `fs.shared` | `/shared` へのアクセス |
| `notifications` | 通知の表示 (`System.notify`, `this.showNotification`) |
| `ipc` | 他のアプリへのメッセージ送信 (`System.sendMessage`) |
| `network` | 外部 URL への fetch |
| `system.info` | システム情報の取得 (`System.listProcesses`) |
| `clipboard` | クリップボードへのアクセス (`navigator.clipboard.*`) |
| `user.info` | 現在ユーザー情報の取得 |
| `user.manage` | ユーザー作成・削除などの管理操作 |

---

## 外部アプリのインストール (Phase 6)

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
  "icon": {
    "type": "set",
    "set": "lucide",
    "name": "sparkles"
  },
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
| `icon` | — | アイコンオブジェクト (`{ type: "set", set?: "lucide", name }` または `{ type: "image", src }`) |
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

---

## `ESKish` — ターミナルアプリ

ESKit 標準の組み込みターミナル環境 (`apps/eskish/`) です。EcmaScript / ESKit API 風の独自コマンド体系により、仮想ファイルシステムやプロセス、セッションを直感的に操作できます。

### コマンドリファレンス

| コマンド | 短縮形 | 引数 | 説明 | 要求権限 |
|---------|-------|------|------|---------|
| `readFile` | `cat` | `<path>` | ファイルをテキストとして読み取り表示 | `fs.read` |
| `writeFile` | `write` | `<path> <text...>` | ファイルにテキストを書き込み | `fs.write` |
| `readDir` | `ls`, `dir` | `[path]` | ディレクトリ内のファイル・ディレクトリ一覧 | `fs.read` |
| `makeDir` | `mkdir` | `<path>` | ディレクトリを作成 (再帰対応) | `fs.write` |
| `remove` | `rm` | `<path>` | ファイルまたはディレクトリを再帰的削除 | `fs.write` |
| `rename` | `mv` | `<from> <to>` | ファイル・ディレクトリのリネーム / 移動 | `fs.write` |
| `stat` | — | `<path>` | ファイル / ディレクトリの詳細情報を表示 | `fs.read` |
| `changeDir` | `cd` | `[path]` | カレントディレクトリを変更 (`~`, `..` 対応) | `fs.read` |
| `currentDir` | `pwd` | — | 現在の作業ディレクトリを表示 | (なし) |
| `listProcesses` | `ps` | — | 実行中のプロセス一覧を表示 | `system.info` |
| `listApps` | `apps` | — | 登録済みアプリ一覧を表示 | (なし) |
| `loadApp` | `open` | `<appDir\|appId>` | 指定アプリを起動 | (なし) |
| `closeApp` | `kill` | `<uuid>` | 指定アプリを終了 | (なし) |
| `focusApp` | `focus` | `<uuid\|prefix>` | 指定アプリウィンドウを最前面にフォーカス | (なし) |
| `sendMessage` | `send` | `<uuid\|prefix> <msg>` | プロセスへ IPC メッセージを送信 (JSON自動判定) | `ipc` |
| `currentUser` | `whoami` | — | 現在ログイン中のユーザー情報を表示 | `user.info` |
| `listUsers` | `users` | — | 登録済みユーザー一覧を表示 | `user.info` |
| `logout` | — | — | ログアウトしてログイン画面へ戻る | (なし) |
| `systemInfo` | `sysinfo` | — | OS・ユーザー・画面解像度等のサマリを表示 | (なし) |
| `setShellMode` | `mode` | `[mode]` | シェルモード取得または変更 (`desktop`/`mobile`/`auto`) | (なし) |
| `history` | — | — | コマンド実行履歴を番号付きで表示 | (なし) |
| `notify` | — | `<title> [message]` | システム通知を発行 | `notifications` |
| `eval` | `js` | `<code...>` | 現在のコンテキスト (`this`, `System`) で JS 式を実行 | (実行内容に準拠) |
| `clear` | `cls` | — | ターミナル画面を消去 | (なし) |
| `help` | `?` | — | 利用可能なコマンド一覧と説明を表示 | (なし) |

---

## `System.theme` — テーマ & 外観管理

システム全体のカラーモード（ライト/ダーク/OS連動）、カラーテーマプリセット、カスタム CSS 変数、壁紙を管理する `ESKitTheme` インスタンスです。
設定は VFS（`/home/{userId}/.config/theme.json`）に永続化されます。

```js
System.theme.mode;        // "light" | "dark" | "auto"
System.theme.current;     // 現在のテーマプリセット ID (例: "catppuccin-mocha")
System.theme.isDark;      // boolean (現在の実効ダークモード判定)
System.theme.list;        // 利用可能な全テーマ一覧 (ThemeMeta[])
System.theme.wallpapers;  // 組み込み壁紙プリセット一覧
System.theme.vars;        // 現在適用されている全 CSS 変数マップ
System.theme.wallpaper;   // 現在の壁紙 CSS 値

System.theme.setMode("dark");                  // カラーモードを変更 ("light" | "dark" | "auto")
System.theme.apply("nord");                    // プリセットテーマを適用
System.theme.applyVars({ "--kit-color-primary": "#e63946" }); // カスタム CSS 変数を直接適用
System.theme.setWallpaper("radial-gradient(...)"); // 壁紙を変更
await System.theme.load("https://example.com/theme.json"); // 外部 URL からテーマを fetch・インポート
System.theme.reset();                          // デフォルトテーマにリセット
const jsonStr = System.theme.export();         // 現在のテーマ設定を JSON 出力
```

### イベント

テーマ変更時には `System.events` から `"system:theme-changed"` イベントが発行されます。
```js
System.events.on("system:theme-changed", ({ id, mode, dark, vars, wallpaper }) => {
  console.log("Theme updated:", id, mode);
});
```

---

## `System.i18n` — 多言語対応

Hamon の Signal を活用したリアクティブな多言語翻訳サービスを提供する `ESKitI18n` インスタンスです。
設定は VFS（`/home/{userId}/.config/i18n.json`）に永続化されます。

```js
System.i18n.current;      // 現在の言語コード ("ja" | "en")
System.i18n.available;    // 利用可能な言語一覧 (["ja", "en"])
System.i18n.locale;       // Hamon Signal<string>

// 翻訳テキストの取得 (Hamon テンプレート内で自動依存追跡)
System.i18n.t("system.desktop"); // "デスクトップ" (ja) / "Desktop" (en)
System.i18n.t("verifierTest.testGreeting", { name: "ESKit" }); // テンプレート変数補間

// 言語の変更
await System.i18n.setLocale("en");

// アプリ独自辞書の登録・拡張
System.i18n.extend("myApp", "ja", {
  title: "マイアプリ",
  welcome: "ようこそ {user} さん",
});
```

---

## `System.dialog` — 汎用ダイアログ

Popover API を用いたモーダル・ダイアログの表示と非同期待機を提供するファサードです。

```js
// 1. アラート
await System.dialog.alert({
  title: "完了",
  message: "ファイルの保存が完了しました。",
  icon: "check-circle",
});

// 2. 確認ダイアログ
const ok = await System.dialog.confirm({
  title: "削除の確認",
  message: "本当にこのファイルを削除しますか？",
  danger: true,
  okText: "削除",
  cancelText: "キャンセル",
});

// 3. 入力ダイアログ
const input = await System.dialog.prompt({
  title: "新しいフォルダ名",
  defaultValue: "New Folder",
  placeholder: "フォルダ名を入力",
});

// 4. カスタムダイアログ
const buttonId = await System.dialog.custom({
  title: "カスタム設定",
  message: "オプションを選択してください",
  content: customDomNodeOrString,
  buttons: [
    { id: "cancel", label: "キャンセル", flat: true },
    { id: "save", label: "保存", primary: true },
  ],
});
```

---

## `System.notifications` — 通知センター

受信した通知の履歴管理と状態管理を行うストアです。

```js
System.notifications.list();         // 受信した通知一覧 ({ id, title, message, type, time, read }[])
System.notifications.unreadCount;    // 未読通知数
System.notifications.markAllRead();  // すべて既読にする
System.notifications.clear();        // 履歴をすべて消去
```

---

## `設定` (SettingsApp) — システム設定アプリ

`apps/settings/` に配置された、Hamon リアクティブテンプレートエンジンで構築された標準設定アプリです。

### 提供機能
1. **外観 (Appearance):** カラーモード（ライト/ダーク/OS連動）切替、8 種類のテーマプリセット選択、壁紙ギャラリー選択、外部 URL からのテーマインポート、現在のテーマ設定のエクスポート
2. **言語 (Language):** 表示言語（日本語 / English）の即時切替
3. **通知 (Notifications):** 通知履歴（Notification Center）の閲覧・消去、テスト通知送信
4. **システム (System):** OS バージョン・ユーザー・シェルモード等のシステムサマリ、実行中プロセス一覧と強制終了
5. **権限 (Permissions):** 実行中アプリの要求権限一覧の確認と個別取り消し


