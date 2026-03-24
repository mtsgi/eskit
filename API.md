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
System.notify({ title, message, duration });  // 通知を表示
System.sendMessage(targetUuid, data);         // アプリ間 IPC
System.nextZIndex();                          // フォーカス用 z-index を取得 (呼ぶたびに増加)

// サブシステムへのアクセス
System.events      // ESKitEventBus
System.fs          // ESKitFileSystem
System.registry    // ESKitRegistry
System.permissions // ESKitPermissions
```

### `System.ready`

ブート完了を待てる Promise です。`system:ready` イベントが発火するまで解決しません。

```js
await System.ready;
// ブート完了後の処理
```

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

---

## `System.registry` — アプリレジストリ

```js
// define.json からアプリを登録
const manifest = await System.registry.register("apps/myapp/");

// 登録済みアプリ一覧
const apps = System.registry.list();
// → [{ id, name, entry, version, description, permissions, icon }, ...]

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
```

---

## `ESKitApp` — アプリ基底クラス

すべての ESKit アプリはこのクラスを継承します。

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
