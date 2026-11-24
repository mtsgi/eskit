# ESKit API リファレンス

> [← README に戻る](README.md) | [設計計画・ロードマップ (PLAN.md) →](PLAN.md)

このドキュメントは ESKit の **アプリ開発者向け API**、**UI・テンプレート API**、**システムコア API**、**組み込みアプリ仕様** を役割別に整理したリファレンスです。

---

## 目次

- **1. アプリ開発者向けガイド**
  - [1.1 `define.json` — アプリマニフェスト](#11-definejson--アプリマニフェスト)
  - [1.2 `ESKitApp` — アプリ基底クラス](#12-eskitapp--アプリ基底クラス)
  - [1.3 ファイル関連付けと起動引数 (`System.openFile`)](#13-ファイル関連付けと起動引数-systemopenfile)
  - [1.4 アプリ多言語化 (App i18n)](#14-アプリ多言語化-app-i18n)
  - [1.5 権限モデル](#15-権限モデル)
- **2. UI・テンプレート・コンポーネント**
  - [2.1 `Hamon` — リアクティブテンプレートエンジン](#21-hamon--リアクティブテンプレートエンジン)
  - [2.2 `System.icons` & `<eskit-icon>`](#22-systemicons--eskit-icon)
  - [2.3 `System.dialog` & `System.showOpenFilePicker`](#23-systemdialog--systemshowopenfilepicker)
  - [2.4 `System.notifications` & `System.notify`](#24-systemnotifications--systemnotify)
- **3. システムコア・サービス API**
  - [3.1 `System` (グローバル) & `System.ready`](#31-system-グローバル--systemready)
  - [3.2 `System.fs` — 仮想ファイルシステム](#32-systemfs--仮想ファイルシステム)
  - [3.3 `System.users` — ユーザー / セッション](#33-systemusers--ユーザー--セッション)
  - [3.4 `System.registry` — アプリレジストリ & 外部アプリインストール](#34-systemregistry--アプリレジストリ--外部アプリインストール)
  - [3.5 `System.permissions` — 権限マネージャー](#35-systempermissions--権限マネージャー)
  - [3.6 `System.events` — イベントバス & システムイベント一覧](#36-systemevents--イベントバス--システムイベント一覧)
  - [3.7 `System.theme` — テーマ & 外観管理](#37-systemtheme--テーマ--外観管理)
  - [3.8 `System.i18n` — 多言語対応サービス](#38-systemi18n--多言語対応サービス)
  - [3.9 `System.shellMode` — シェルモード](#39-systemshellmode--シェルモード)
  - [3.10 `System.WindowSystem` & `ESKitWindowElement`](#310-systemwindowsystem--eskitwindowelement)
  - [3.11 PWA & Service Worker](#311-pwa--service-worker)
- **4. 組み込みアプリリファレンス**
  - [4.1 `ESKish` — 標準ターミナル環境](#41-eskish--標準ターミナル環境)
  - [4.2 `Settings` — システム設定アプリ](#42-settings--システム設定アプリ)
  - [4.3 標準サンプルアプリ一覧](#43-標準サンプルアプリ一覧)

---

## 1. アプリ開発者向けガイド

### 1.1 `define.json` — アプリマニフェスト

各アプリのルートディレクトリに配置する JSON ファイルです。

```json
{
  "id": "com.example.myapp",
  "name": {
    "ja": "マイアプリ",
    "en": "My App"
  },
  "description": {
    "ja": "アプリの説明",
    "en": "App description"
  },
  "entry": "main.js",
  "version": "1.0.0",
  "icon": {
    "type": "set",
    "set": "lucide",
    "name": "sparkles"
  },
  "permissions": ["fs.read", "notifications"],
  "fileAssociations": [".txt", ".md"],
  "i18n": "./i18n/"
}
```

| フィールド | 必須 | 型 | 説明 |
|---------|------|----|------|
| `id` | ✅ | `string` | 一意なリバースドメイン形式の ID |
| `name` | ✅ | `string \| Record<string, string>` | 表示名（多言語オブジェクトも可） |
| `entry` | ✅ | `string` | エントリポイント JS ファイル名 |
| `version` | — | `string` | バージョン文字列（省略時 `"0.0.1"`） |
| `description` | — | `string \| Record<string, string>` | アプリの説明（省略時 `""`） |
| `icon` | — | `object` | `{ type: "set", set?: "lucide", name }` または `{ type: "image", src }` |
| `permissions` | — | `string[]` | 要求権限の配列 |
| `fileAssociations` | — | `string[]` | 関連付けるファイル拡張子（例: `[".txt", ".md"]`、先頭 `.` は自動正規化） |
| `i18n` | — | `string` | アプリ固有辞書ディレクトリ（省略時 `"./i18n/"`） |

---

### 1.2 `ESKitApp` — アプリ基底クラス

すべての ESKit アプリは `system/app.js` の `ESKitApp` を継承します。

#### アプリの定義パターン

```js
import ESKitApp from "system/app.js";
import hamon from "system/hamon.js";
import { css } from "system/util.js";

export default class MyApp extends ESKitApp {
  static style = css`
    h1 { color: var(--kit-color-primary); }
  `;

  constructor() {
    super();
    const count = this.hamon.signal(0);
    this.template = hamon`
      <h1>Hello, ESKit!</h1>
      <button id="btn" @click=${() => count.value++}>
        Count: ${() => count.value}
      </button>
    `;
  }

  initialize() {
    // _uuid, _manifest, _windowElement が注入された後に呼ばれる
  }

  close() {
    // アプリ終了直前のクリーンアップ (タイマー停止など)
  }
}
```

静的 HTML を使う場合は `static template = html`...``（`system/util.js`）も指定できます。

#### ライフサイクルとフック

`System.loadApp(appDir, options)` は以下の順序でアプリを起動します。

1. `new AppClass()`（コンストラクタ）
2. `_uuid`, `_manifest`, `launchData`, `_windowElement` を注入し、自動タイトル同期を開始
3. `app.initialize()` を**同期呼び出し**（`async initialize()` の完了は待機しません）
4. `options.filePath` があり `onOpenFile` が定義されていれば `await app.onOpenFile(options.filePath)` を実行
5. 終了されていないことを確認して `app:opened` イベントを発行

| フック | 呼ばれるタイミング / 現状 |
|--------|------------------------|
| `initialize()` | `_uuid`, `_manifest`, `_windowElement` 注入後 |
| `onOpenFile(filePath)` | `System.openFile()` 等でファイルパス付き起動された直後 |
| `close()` | アプリ終了直前（`closeApp()` から同期呼び出し） |
| `onMessage(data)` | `System.sendMessage()` で IPC データを受信したとき |
| `onFocus()` / `onBlur()` / `onResize(w, h)` / `onMinimize()` / `onRestore()` | ※ 将来の Lifecycle 統合用の予約フック（現行の `ESKitWindowSystem` からは自動発火されません） |

#### 開発者 API

```js
// UI・タイトル・ダイアログ
this.setTitle(title)                  // 文字列 / getter 関数 / Hamon Signal を指定可能
this.querySelector(selector)          // Shadow DOM 内の要素を取得
this.querySelectorAll(selector)       // Shadow DOM 内の要素を全取得
this.t(key, vars)                     // 多言語翻訳 (アプリ名前空間を優先補完)
await this.confirm(opts)              // System.dialog.confirm() のショートハンド
await this.alert(opts)                // System.dialog.alert() のショートハンド
await this.prompt(opts)               // System.dialog.prompt() のショートハンド
await this.showOpenFilePicker(opts)   // System.showOpenFilePicker() のショートハンド

// システム連携 (マニフェストの permissions 宣言 + ユーザー許可が必要)
await this.showNotification(opts)     // permissions: "notifications"
await this.sendMessage(targetUuid, data) // permissions: "ipc"
await this.listProcesses()            // permissions: "system.info"

// 仮想ファイルシステムファサード (マニフェストの permissions と連動)
await this.fs.readFile(path)          // permissions: "fs.read"
await this.fs.readFileAsBytes(path)   // permissions: "fs.read"
await this.fs.readdir(path)           // permissions: "fs.read"
await this.fs.stat(path)              // permissions: "fs.read"
await this.fs.exists(path)            // permissions: "fs.read"
await this.fs.writeFile(path, data)   // permissions: "fs.write"
await this.fs.mkdir(path, opts)       // permissions: "fs.write"
await this.fs.remove(path, opts)      // permissions: "fs.write"
await this.fs.rename(oldPath, newPath)// permissions: "fs.write"
```

#### プロパティ

| プロパティ | 説明 |
|----------|------|
| `this.name` | 現在のウィンドウタイトル文字列 |
| `this.windowTitle` | `this.name` を返すゲッター |
| `this.manifest` | 全階層をコピー・`Object.freeze` した読み取り専用 `Manifest`（起動前は `null`） |
| `this.launchData` | `loadApp(dir, options)` に渡された `options` オブジェクト（例: `{ filePath }`） |
| `this.hamon` | アプリ専用の `HamonScope`（アプリ終了時に自動 `dispose()`） |
| `this._uuid` | アプリインスタンス固有の UUID |
| `this._manifest` | 内部用 Manifest オブジェクト |
| `this._state` | `"initializing"` / `"running"` / `"closed"` |
| `this._windowElement` | 対応する `<eskit-window>` 要素 |

---

### 1.3 ファイル関連付けと起動引数 (`System.openFile`)

拡張子に応じたアプリを自動検出し、`{ filePath }` 付きで起動します。

```js
await System.openFile("/home/admin/desktop/Welcome.txt");
```

- 関連付けられたアプリが見つからない場合でも、テキスト系拡張子（`.txt`, `.md`, `.json`, `.js`, `.css`, `.html`, `.csv`, `.log`, `.xml`, `.yaml`, `.yml`, 拡張子なし）は `apps/notepad/` にフォールバックします。
- それでも開けるアプリがない場合はアラートダイアログを表示し、`null` を返します（起動成功時は `Promise<string>` の UUID を返します）。

```js
export default class NotepadApp extends ESKitApp {
  initialize() {
    // UI 初期化のみ（ここで launchData.filePath を二重読込しない）
  }

  async onOpenFile(filePath) {
    const text = await this.fs.readFile(filePath);
    // ファイル内容を表示
  }
}
```

---

### 1.4 アプリ多言語化 (App i18n)

#### マニフェストと辞書ファイル

`define.json` の `name`・`description` に言語別オブジェクトを指定でき、`apps/<name>/i18n/{lang}.json` を配置すると `loadApp()` 時に自動読み込みされます。

```json
// apps/notepad/i18n/ja.json
{
  "file": "ファイル",
  "save": "保存",
  "unsaved": "未保存の変更があります"
}
```

#### `this.t()` とウィンドウタイトル自動同期

`this.t(key, vars)` はドットを含まないキーの場合、アプリ自身の短縮 ID（例: `eskit.notepad` → `notepad`）を名前空間として優先解決し、見つからなければシステム辞書へフォールバックします。

```js
this.t("save");         // => "保存" (notepad.save を優先解決)
this.t("notepad.save"); // => "保存"
this.t("dialog.ok");    // => "OK" (システム共通辞書)
```

- `this.setTitle()` を呼ばない場合、ウィンドウタイトルは現在の言語に応じた `define.json` の `name` と自動同期されます。
- `this.setTitle(fnOrSignal)` にリアクティブな値（関数または Hamon Signal）を渡すと、言語やファイル名に応じてタイトルを自動更新できます。

```js
this.setTitle(() => `${this.filePath.value || "Untitled"} - ${this.t("name")}`);
```

---

### 1.5 権限モデル

ESKit はアプリからの API 利用に対し、協調的な 2 段階権限モデルを採用しています。

```
Install-time チェック (define.json の permissions[] 宣言)
  ├─ 宣言あり → Runtime チェック (System.permissions.check)
  │                ├─ localStorage にユーザー別の許可/拒否記録あり → 即許可 / 即拒否
  │                └─ 初回アクセス → <eskit-permission-dialog> でユーザー確認 → 記録
  └─ 宣言なし → 即拒否
```

> **信頼モデルに関する注意:** ESKit の組み込みアプリ・外部アプリは同一 JavaScript Realm で実行されます。権限モデル・`ESKitApp.fs` ラッパー・ローカルユーザー認証は、協調的なアプリの API 利用とユーザー操作を管理するためのものであり、悪意あるコードによるブラウザ標準 API（直接 `fetch` / `navigator.clipboard` / `window.System` / `IndexedDB`）の呼び出しを物理的に遮断するセキュリティ境界ではありません。

#### 利用可能な権限

| 権限 | 対象と現行の制約 |
|------|-----------------|
| `fs.read` | `this.fs` の読み取り系メソッド（`readFile`, `readFileAsBytes`, `readdir`, `stat`, `exists`） |
| `fs.write` | `this.fs` の書き込み系メソッド（`writeFile`, `mkdir`, `remove`, `rename`） |
| `fs.read.all` / `fs.write.all` / `fs.shared` | マニフェスト宣言は受理。アプリ向けパススコープの細かい制御は今後の改善対象 |
| `notifications` | `this.showNotification()` |
| `ipc` | `this.sendMessage()` |
| `system.info` | `this.listProcesses()` |
| `user.info` / `user.manage` | ユーザー情報の参照・管理操作の宣言 |
| `network` | マニフェスト宣言は受理（現状 Native `fetch()` を強制遮断する仕組みはありません） |
| `clipboard` | マニフェスト宣言は受理（現状 `navigator.clipboard` を強制遮断する仕組みはありません） |

---

## 2. UI・テンプレート・コンポーネント

### 2.1 `Hamon` — リアクティブテンプレートエンジン

`system/hamon.js` — VDOM を使わないシグナル方式のリアクティブテンプレートエンジンです。

```js
import hamon, { signal, computed, effect, list, isSignal, HamonScope } from "system/hamon.js";
```

#### リアクティブプリミティブ

| API | 用途 | 例 |
|-----|------|----|
| `signal(initial)` | 読み書き可能なリアクティブ値 | `const n = signal(0); n.value++; n.peek();` |
| `computed(fn)` | 依存元から自動再計算される読み取り専用 Signal | `const double = computed(() => n.value * 2);` |
| `effect(fn)` | 依存 Signal 変化時に再実行（戻り値関数でクリーンアップ） | `const dispose = effect(() => { ... });` |
| `isSignal(v)` | Signal オブジェクトか判定 | `isSignal(n) // true` |

#### `hamon` タグ付きテンプレート

リアクティブな `DocumentFragment`（`_scope: HamonScope` 付き）を返します。

```js
const count = signal(0);
const show = signal(true);
const items = signal(["Apple", "Banana"]);

const fragment = hamon`
  <button @click=${() => count.value++} :disabled=${() => count.value > 10}>
    Count: ${() => count.value}
  </button>
  <div kit-if=${() => show.value}>表示中</div>
  <div kit-else>非表示</div>
  <ul>
    ${list(() => items.value, (item) => hamon`<li>${item}</li>`)}
  </ul>
`;
```

- **テキスト補間:** `${value}`（静的）、`${() => expr}` / `${signalObj}`（リアクティブ更新。戻り値が `Node` / `DocumentFragment` の場合は DOM 挿入）。
- **イベントバインディング (`@event`):** `@click=${handler}` 形式で登録し、`_scope.dispose()` 時に自動 `removeEventListener` されます。
- **属性バインディング (`:attr`):** 動的な属性は必ず `:attr=${value}` の形式で指定してください。`title=${value}` や `class="prefix ${value}"` のような構文はコンパイル時に `TypeError` となります。
  - `value`, `checked`, `selected`, `disabled` は DOM プロパティに直接代入され、その他は `setAttribute` / `removeAttribute` で反映されます（`false` / `null` で属性削除、`true` で空属性）。
- **条件分岐 (`kit-if` / `kit-else`):** Comment ノードをアンカーに DOM 挿入・除去を行います（要素ノード自体は保持）。`kit-else` は直前の `kit-if` 要素の次の兄弟要素として記述します。
- **リスト描画 (`list(itemsFn, renderFn)`):** 配列変化時に再レンダリングし、前回の各アイテム `_scope` を自動 `dispose()` します。

#### `HamonScope` と `ESKitApp` 統合

```js
const scope = new HamonScope();
const count = scope.signal(0);
scope.effect(() => console.log(count.value));
scope.onDispose(() => { /* cleanup */ });
scope.dispose(); // 追跡中の effect とコールバックを一括解除
```

`ESKitApp` 内では `this.hamon` を使うことで、アプリ終了時（`closeApp()`）にすべての `effect` / イベントリスナー / `onDispose` が自動解放されます。

---

### 2.2 `System.icons` & `<eskit-icon>`

アイコンセット（標準で Lucide Icons を内蔵）を管理し、SVG アイコンを描画します。

```js
System.icons.has("lucide", "search");  // true
System.icons.get("lucide", "search");  // SVG 内部文字列
System.icons.listSets();               // ["lucide"]
System.icons.listIcons("lucide");      // ["minus", "square", "search", ...]

// 独自アイコンセットの登録
System.icons.registerSet("my-icons", {
  "custom-star": '<polygon points="12 2 ..."/>',
});

// マニフェストの icon 定義から DOM 要素を生成
const appIcon = System.icons.createAppIcon(manifest.icon, { size: 24 });
```

#### `<eskit-icon>` と `icon()` ヘルパー

```html
<eskit-icon set="lucide" name="search" size="18"></eskit-icon>
<eskit-icon set="lucide" name="x" size="14" stroke-width="2.5" color="#ef4444"></eskit-icon>
```

| 属性 | デフォルト | 説明 |
|------|-----------|------|
| `set` | `"lucide"` | アイコンセット名 |
| `name` | (必須) | アイコン名 |
| `size` | `"1em"` | サイズ（数値指定時は `px` 単位） |
| `stroke-width` | `"2"` | 線の太さ |
| `color` | `"currentColor"` | 描画色 |

```js
import { icon } from "system/icons.js";

const btn = hamon`
  <button class="kit-button">
    ${icon("lucide", "sparkles", { size: 16 })}
    <span>実行</span>
  </button>
`;
```

---

### 2.3 `System.dialog` & `System.showOpenFilePicker`

Popover API を用いたシステム標準ダイアログと仮想 FS ファイル選択ダイアログです。アプリ内では `this.alert()` / `this.confirm()` / `this.prompt()` / `this.showOpenFilePicker()` のショートハンドも使えます。

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
const folderName = await System.dialog.prompt({
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

// 5. 汎用ファイル選択ダイアログ (※ System.dialog ではなく System 直下)
const filePath = await System.showOpenFilePicker({
  title: "画像を選択",
  startPath: "/home/admin/Pictures",
  accepts: [".png", ".jpg", ".jpeg", ".webp", ".svg"],
});
```

---

### 2.4 `System.notifications` & `System.notify`

```js
// トースト通知を発行し、履歴ストアに追加
System.notify({
  title: "保存しました",
  message: "Welcome.txt を更新しました",
  type: "info", // "info" | "success" | "warning" | "error"
  duration: 4000,
});

// 通知履歴ストアの操作
System.notifications.list();         // [{ id, title, message, type, icon, time, read }, ...]
System.notifications.unreadCount;    // 未読通知数
System.notifications.markAllRead();  // すべて既読にする
System.notifications.clear();        // 履歴をすべて消去
```

---

## 3. システムコア・サービス API

### 3.1 `System` (グローバル) & `System.ready`

`window.System`（`globalThis.System`）として公開される `ESKitSystem` のインスタンスです。

> **ES Modules に関する注意:** `index.html` は `type="module"` で読み込まれるため、ファイル先頭で `const System = globalThis.System;` と宣言するか `globalThis.System` 経由で参照してください。

```js
const System = globalThis.System;

await System.ready;                                   // system:ready 発火まで待機
await System.loadApp("apps/myapp/", { filePath });    // アプリを起動 → UUID を返す
await System.openFile("/home/admin/desktop/Welcome.txt"); // 拡張子関連付けで起動
System.closeApp(uuid);                                // アプリを終了
System.getApp(uuid);                                  // ESKitApp インスタンス取得
System.listProcesses();                               // [{ uuid, name, icon, state }, ...]
System.listApps();                                    // 登録済み Manifest 一覧
System.sendMessage(targetUuid, data);                 // アプリ間 IPC
System.setShellMode("desktop" | "mobile" | "auto");   // シェルモード切替
System.nextZIndex();                                  // フォーカス用 z-index 取得
System.generateUUID();                                // crypto.randomUUID() ラッパー
System.currentUser;                                   // { id, name, isAdmin, createdAt } | null
System.homeDir();                                     // 現在ユーザーのホームパス (例: "/home/admin")
System.homeDir("alice");                              // 指定ユーザーのホームパス
System.logout();                                      // ログアウトしてリロード
```

#### サブシステム一覧

| プロパティ | クラス / 実体 | 役割 |
|-----------|--------------|------|
| `System.events` | `ESKitEventBus` | イベントバス |
| `System.fs` | `ESKitFileSystem` | 仮想ファイルシステム (IndexedDB) |
| `System.registry` | `ESKitRegistry` | アプリレジストリ |
| `System.permissions` | `ESKitPermissions` | 権限マネージャー |
| `System.users` | `ESKitUsers` | ユーザー / セッション管理 |
| `System.shellMode` | `ESKitShellMode` | desktop / mobile モード管理 |
| `System.icons` | `ESKitIcons` | アイコンレジストリ |
| `System.theme` | `ESKitTheme` | テーマ・壁紙管理 |
| `System.i18n` | `ESKitI18n` | 多言語辞書・翻訳サービス |
| `System.manifest` | `ESKitManifest` | マニフェスト検証ユーティリティ |
| `System.dialog` | `ESKitDialogElement` | モーダルダイアログ |
| `System.notifications` | `ESKitNotificationsStore` | 通知履歴ストア |
| `System.WindowSystem` | `ESKitWindowSystem` | ウィンドウ / シェル UI 管理（ブート後） |

---

### 3.2 `System.fs` — 仮想ファイルシステム

IndexedDB (`eskit-fs` v1 / ストア `files`) 上に実装された仮想ファイルシステムです。

> **アプリ開発者向け:** 一般アプリからは `System.fs` を直接呼ばず、権限チェックと連動する `this.fs`（`ESKitApp` ファサード）を使用してください。

#### パス規約と初期ディレクトリ

- ユーザーホーム: `/home/{userId}`（配下に `desktop/`, `documents/`, `bin/`, `.config/` を自動生成）
- 共有領域: `/shared`
- システム領域: `/system`, `/apps`, `/system/bin`

#### ファイル・ディレクトリ操作

```js
const home = System.homeDir();

// 書き込み (文字列 / Uint8Array / ArrayBuffer / Blob を内部的に Uint8Array へ変換、親ディレクトリ自動作成)
await System.fs.writeFile(`${home}/note.txt`, "Hello, ESKit!");
await System.fs.writeFile(`${home}/icon.png`, new Uint8Array([0x89, 0x50, 0x4e, 0x47]));

// 読み込み
const text  = await System.fs.readFile(`${home}/note.txt`);        // UTF-8 テキスト
const bytes = await System.fs.readFileAsBytes(`${home}/icon.png`); // Uint8Array

// ディレクトリ・情報・削除・移動
await System.fs.mkdir(`${home}/docs`, { recursive: true });
const entries = await System.fs.readdir(home); // [{ name, path, type, owner, mode, size, createdAt, modifiedAt }, ...]
const info    = await System.fs.stat(`${home}/note.txt`);
const ok      = await System.fs.exists(`${home}/note.txt`);
await System.fs.rename(`${home}/note.txt`, `${home}/memo.txt`);
await System.fs.remove(`${home}/docs`, { recursive: true });
```

#### アクセスモード (`mode`)

各エントリには `owner` と `mode`（`owner: { read, write }`, `others: { read, write }`）が付与されます。

- ユーザーホーム (`/home/{id}`): 作成者のみ読み書き可（`others` は不可）
- 通常ファイル: `owner` 読み書き可 / `others` 不可
- 通常ディレクトリ: `owner` 読み書き可 / `others` 読み取りのみ可

---

### 3.3 `System.users` — ユーザー / セッション

ユーザーとログインセッションを管理する `ESKitUsers` インスタンスです。

```js
System.users.hasUsers();
System.users.list();
System.users.get("admin");
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

#### ユーザー仕様

- **初回ブート時:** ユーザーが存在しない場合、システムが自動でデフォルト管理者 `admin`（`isAdmin: true`, 空パスワード）を作成して自動ログインします。
- **ユーザー ID:** 英小文字で始まる 1〜31 文字（英小文字・数字・`_`・`-`）。
- **パスワード:** 空欄または 4 文字以上。PBKDF2 (SHA-256, 210,000 回反復) でハッシュ化して `localStorage` に保存します。
- **権限制約:** `isAdmin: true` ユーザーの作成（既存ユーザーがいる場合）および `delete()` は管理者のみ実行可能です。最後の管理者ユーザーは削除できません。
- **セッション:** ログイン中のユーザー ID は `localStorage` に保持されます。

---

### 3.4 `System.registry` — アプリレジストリ & 外部アプリインストール

組み込みアプリおよび外部 URL アプリの登録・検索・永続化を行います。

```js
// 登録・取得・検索
await System.registry.register("apps/myapp/");
System.registry.get("com.example.myapp");
System.registry.getByDir("apps/myapp/");
System.registry.list();
System.registry.search("notepad");
System.registry.findAppByExtension(".txt");

// 外部 URL からインストール / アンインストール
await System.registry.registerFromUrl("https://example.com/myapp/");
await System.registry.uninstall("com.example.myapp");
```

#### `registerFromUrl(url)` の動作フロー

1. URL を検証（`https://`、同一オリジンの相対パス `./`・`/`、`http://localhost` のみ許可）し、`{url}/define.json` を `fetch` して `ESKitManifest.validate()` で検証します。**登録時にはエントリポイントのコードは実行しません。**
2. `<eskit-dialog>` でアプリ名・バージョン・ID・説明・要求権限をユーザーに提示して確認します。
3. 承認されるとレジストリに登録し、VFS（管理者は `/system/installed-apps.json`、一般ユーザーは `/home/{userId}/.config/installed-apps.json`）に保存し、`registry:installed` を発行します。
4. 実際のコード読み込みは `System.loadApp()` 実行時に Native `import()` で行われます。

---

### 3.5 `System.permissions` — 権限マネージャー

```js
// Install-time チェック (同期)
System.permissions.isDeclared(uuid, "fs.read"); // boolean

// Runtime チェック (非同期、初回はダイアログ表示)
const granted = await System.permissions.check(uuid, "notifications");

// 明示的な許可 / 拒否 / 取消 (ユーザーごとに localStorage へ永続化)
System.permissions.grant(appId, "fs.read");         // 許可
System.permissions.grant(appId, "fs.read", false);  // 拒否
System.permissions.deny(appId, "fs.read");          // 拒否ショートハンド
System.permissions.revokePermission(appId, "fs.read"); // 個別取り消し
System.permissions.revokeAll(appId);                // アプリの全権限を取り消し
System.permissions.getPermissionState(appId, "fs.read"); // "granted" | "denied" | "unprompted"
System.permissions.revoke(uuid);                    // セッションキャッシュのみ解除
```

---

### 3.6 `System.events` — イベントバス & システムイベント一覧

シンプルな pub/sub イベントバスです。

```js
const off = System.events.on("app:opened", ({ uuid, name }) => { ... });
off(); // 購読解除
System.events.once("system:ready", ({ user }) => { ... });
System.events.emit("custom:event", { foo: "bar" });
```

#### システムイベント一覧

| イベント名 | ペイロード | 発行タイミング |
|-----------|-----------|--------------|
| `system:ready` | `{ user }` | ブート完了時 |
| `system:theme-changed` | `{ id, mode, dark, vars, wallpaper, resolvedWallpaper }` | テーマ・モード・壁紙変更時 |
| `system:locale-changed` | `{ lang }` | 表示言語変更時 |
| `app:opened` | `{ uuid, name, icon, manifest }` | アプリ起動・初期ファイル配送完了後 |
| `app:closed` | `{ uuid }` | アプリ終了時 |
| `app:focused` | `{ uuid }` | ウィンドウフォーカス変更時 |
| `app:titleChanged` | `{ uuid, title }` | ウィンドウタイトル変更時 |
| `notification:show` | `{ ...opts, id }` | トースト通知表示時 |
| `notifications:updated` | — | 通知履歴の既読・消去時 |
| `launcher:toggle` | — | ランチャー開閉トグル時 |
| `shell:mode-changed` | `{ mode, prev }` | desktop / mobile モード切替時 |
| `drawer:open` / `drawer:close` | — | モバイルドロワー開閉時 |
| `registry:installed` | `{ id, manifest, dir }` | 外部アプリ登録完了時 |
| `registry:uninstalled` | `{ id }` | 外部アプリ登録解除完了時 |
| `permissions:changed` | `{ appId, permission?, state }` | 権限の許可・拒否・取り消し時 |
| `user:created` | `{ user }` | 初回デフォルトユーザー等作成時 |
| `user:logged-in` / `user:logged-out` | `{ user }` | ログイン / ログアウト時 |

---

### 3.7 `System.theme` — テーマ & 外観管理

カラーモード（`"light"` / `"dark"` / `"auto"`）、プリセット、カスタム CSS 変数、壁紙を管理します。設定は VFS（`/home/{userId}/.config/theme.json`）に保存されます。

```js
System.theme.mode;              // "light" | "dark" | "auto"
System.theme.current;           // 現在のテーマプリセット ID
System.theme.isDark;            // 実効ダークモード判定
System.theme.list;              // 利用可能テーマ一覧
System.theme.wallpapers;        // 組み込み壁紙プリセット一覧
System.theme.vars;              // 現在の CSS 変数マップ
System.theme.wallpaper;         // 設定中の壁紙値または VFS パス
System.theme.resolvedWallpaper; // Blob URL 等へ解決済みの CSS 背景値

System.theme.setMode("dark");
await System.theme.apply("nord");
System.theme.applyVars({ "--kit-color-primary": "#e63946" });
await System.theme.setWallpaper("/home/admin/Pictures/wall.png");
await System.theme.load("https://example.com/theme.json");
System.theme.reset();
const json = System.theme.export();
```

> **非同期適用に関する注意:** テーマ・壁紙の適用は非同期で行われます。`resolvedWallpaper` を参照する場合は `await System.theme.apply(id)` や `await System.theme.setWallpaper(value)` の完了後に参照してください（競合時は最新の選択が優先されます）。

---

### 3.8 `System.i18n` — 多言語対応サービス

Hamon Signal を活用した翻訳サービスです。設定は VFS（`/home/{userId}/.config/i18n.json`）に保存されます。

```js
System.i18n.current;    // 現在の言語コード ("ja" | "en")
System.i18n.available;  // ["ja", "en"]
System.i18n.locale;     // Hamon Signal<string>

System.i18n.t("system.desktop");
System.i18n.t("verifierTest.testGreeting", { name: "ESKit" });
await System.i18n.setLocale("en");
System.i18n.extend("myApp", "ja", { title: "マイアプリ" });
```

---

### 3.9 `System.shellMode` — シェルモード

ビューポート幅（`max-width: 768px`）の自動検出と手動切替を管理します。

```js
System.shellMode.current;   // "desktop" | "mobile"
System.shellMode.isDesktop; // boolean
System.shellMode.isMobile;  // boolean
System.shellMode.isLocked;  // 手動固定中なら true

System.shellMode.set("mobile"); // 手動固定
System.shellMode.unlock();      // 自動検出に復帰
```

---

### 3.10 `System.WindowSystem` & `ESKitWindowElement`

ブート完了後に利用可能なウィンドウ・シェル UI 管理クラスです。

```js
System.WindowSystem.activeUuid;
System.WindowSystem.getElement(uuid);
System.WindowSystem.activateWindow(uuid);
System.WindowSystem.getAllElements();
```

#### シェル UI 要素

| プロパティ | 要素 | 説明 |
|-----------|------|------|
| `WindowSystem.desktopElement` | `<eskit-desktop>` | デスクトップルート |
| `WindowSystem.contextMenu` | `<eskit-context-menu>` | 右クリックコンテキストメニュー (`show(x, y, items)`, `hide()`) |
| `WindowSystem.beacon` | `<eskit-beacon>` | グローバル検索オーバーレイ (`Ctrl/Cmd + Space`, `show()`, `hide()`, `toggle()`) |
| `WindowSystem.quickSettings` | `<eskit-quick-settings>` | クイック設定パネル (`show()`, `hide()`, `toggle()`) |
| `WindowSystem.taskbar` | `<eskit-taskbar>` | タスクバー (desktop) |
| `WindowSystem.launcher` | `<eskit-launcher>` | ランチャー (desktop) |
| `WindowSystem.drawer` | `<eskit-drawer>` | アプリドロワー (mobile) |
| `WindowSystem.homeBar` | `<eskit-home-bar>` | ホームバー (mobile) |

#### `ESKitWindowElement` (`app._windowElement`)

- **メソッド:** `focus()`, `minimize()`, `maximize()`, `restore()`, `snap("left" | "right")`, `setTitle(title)`
- **ドラッグ / リサイズ / スナップ:** タイトルバーのドラッグ移動・ダブルクリックで最大化トグル、8 方向リサイズ（最小 220×120px）、画面上端/左右端へのドラッグでスナッププレビューと確定。

---

### 3.11 PWA & Service Worker

- **`manifest.webmanifest`:** 相対 `start_url: "./index.html"` / `scope: "./"` によりサブディレクトリ配信にも対応。
- **`sw.js`:** **Network-First** 戦略。オンライン時は最新ファイルを取得し、オフライン時はキャッシュから応答します。
- **`system/pwa.js`:** SW 更新を監視し、新しいバージョンが待機状態になると再読み込み通知トーストを表示します。ユーザーが再読み込みを選ぶと `SKIP_WAITING` を送信し、制御切替を確認してから 1 度だけリロードします。

---

## 4. 組み込みアプリリファレンス

### 4.1 `ESKish` — 標準ターミナル環境

`apps/eskish/` に配置されたターミナル環境です（要求権限: `fs.read`, `fs.write`, `system.info`, `notifications`, `ipc`, `user.info`）。

#### コマンドリファレンス

| コマンド | 短縮形 | 引数 | 説明 | 要求権限 |
|---------|-------|------|------|---------|
| `readFile` | `cat` | `<path>` | ファイルをテキストとして表示 | `fs.read` |
| `writeFile` | `write` | `<path> <text...>` | ファイルにテキストを書き込み | `fs.write` |
| `readDir` | `ls`, `dir` | `[path]` | ディレクトリ内容一覧 | `fs.read` |
| `makeDir` | `mkdir` | `<path>` | ディレクトリ作成（再帰対応） | `fs.write` |
| `remove` | `rm` | `<path>` | ファイル・ディレクトリ再帰削除 | `fs.write` |
| `rename` | `mv` | `<from> <to>` | リネーム / 移動 | `fs.write` |
| `stat` | — | `<path>` | 詳細情報表示 | `fs.read` |
| `changeDir` | `cd` | `[path]` | カレントディレクトリ移動 (`~`, `..` 対応) | `fs.read` |
| `currentDir` | `pwd` | — | カレントディレクトリ表示 | — |
| `listProcesses` | `ps` | — | 実行中プロセス一覧 | `system.info` |
| `listApps` | `apps` | — | 登録済みアプリ一覧 | — |
| `loadApp` | `open` | `<appDir\|appId>` | アプリ起動 | — |
| `closeApp` | `kill` | `<uuid>` | アプリ終了 | — |
| `focusApp` | `focus` | `<uuid\|prefix>` | ウィンドウを前面フォーカス | — |
| `sendMessage` | `send`, `ipc` | `<uuid\|prefix> <msg>` | IPC メッセージ送信 (JSON 自動判定) | `ipc` |
| `currentUser` | `whoami` | — | 現在ユーザー表示 | `user.info` |
| `listUsers` | `users` | — | 登録ユーザー一覧 | `user.info` |
| `logout` | — | — | ログアウト | — |
| `systemInfo` | `sysinfo` | — | OS・ユーザー・画面情報サマリ | — |
| `setShellMode` | `mode` | `[mode]` | シェルモード取得・切替 | — |
| `openFile` | — | `<path>` | 関連付けアプリでファイルを開く | — |
| `installApp` | — | `<url>` | 外部 URL アプリをインストール | — |
| `uninstallApp` | — | `<id>` | 外部アプリをアンインストール | — |
| `history` | — | — | コマンド履歴表示 | — |
| `notify` | — | `<title> [message]` | システム通知発行 | `notifications` |
| `eval` | `js` | `<code...>` | JS 式を実行 | 実行内容に準拠 |
| `clear` | `cls` | — | 画面消去 | — |
| `help` | `?` | — | ヘルプ表示 | — |

#### カスタムコマンド拡張

- **VFS スクリプト:** `/home/{userId}/bin/<cmd>.js` または `/system/bin/<cmd>.js` に `export default async function({ System, app, fs, args }) { ... }` を配置すると、`<cmd>` コマンドとして実行できます。
- **静的登録:** `ESKishApp.registerCommand(name, handler)`（またはインスタンスの `registerCommand`）でも拡張可能です。

---

### 4.2 `Settings` — システム設定アプリ

`apps/settings/` に配置された設定アプリです。

1. **外観 (Appearance):** ライト / ダーク / OS 連動切替、テーマプリセット選択、壁紙選択、テーマ JSON のインポート / エクスポート
2. **言語 (Language):** 日本語 / English の即時切替
3. **通知 (Notifications):** 通知履歴の閲覧・消去・テスト通知送信
4. **システム (System):** OS サマリ、実行中プロセス一覧と終了操作
5. **権限 (Permissions):** 実行中アプリの要求権限確認と個別取り消し

---

### 4.3 標準サンプルアプリ一覧

| アプリ | ディレクトリ | 主な機能 |
|--------|------------|---------|
| **Notepad** | `apps/notepad/` | VFS 読込・保存・別名保存・PC ダウンロード・`Ctrl+S`・拡張子関連付け |
| **Calculator** | `apps/calculator/` | 四則演算・数式表示・符号反転・パーセント・キーボード入力 |
| **Clock** | `apps/clock/` | アナログ/デジタル時計・ストップウォッチ・タイマー (Web Audio アラーム & 通知) |
| **FileManager** | `apps/filemanager/` | 階層ナビ・作成/リネーム/削除・PC からの Drag&Drop 導入・PC へのダウンロード |
