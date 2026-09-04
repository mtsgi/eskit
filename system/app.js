/**
 * ESKitApp — アプリ基底クラス
 *
 * すべての ESKit アプリはこのクラスを継承する。
 *
 * ライフサイクル:
 *   new AppClass()         → コンストラクタで name/template/style を設定
 *   ESKitSystem.loadApp()  → _uuid, _manifest, _windowElement を注入
 *   initialize()           → アプリ固有の初期化 (querySelector 使用可)
 *   close()                → クリーンアップ
 *
 * static プロパティによる宣言も可能:
 *   class MyApp extends ESKitApp {
 *     static template = html`...`;
 *     static style    = css`...`;
 *   }
 */
export default class ESKitApp {
  // ESKitSystem によって注入されるプロパティ
  _uuid          = null;
  _manifest      = null;
  _state         = "initializing";
  _windowElement = null;
  /** @type {object|null} アプリ起動時に渡された引数やコンテキストデータ */
  launchData     = null;
  /** @type {import('./hamon.js').HamonScope|null} Hamon スコープ (テンプレートまたは手動で設定) */
  _hamonScope    = null;

  constructor() {
    this.name     = this.constructor.name     || "(not_set)";
    this.template = this.constructor.template ?? "";
    this.style    = this.constructor.style    ?? null;
    // Note: initialize() は ESKitSystem が _windowElement 注入後に呼び出す
  }

  /**
   * アプリマニフェスト（読み取り専用・イミュータブルコピー）
   * @returns {Readonly<object>|null}
   */
  get manifest() {
    if (!this._manifest) return null;
    return Object.freeze({
      ...this._manifest,
      icon: this._manifest.icon ? Object.freeze({ ...this._manifest.icon }) : null,
      permissions: Object.freeze([...(this._manifest.permissions || [])]),
    });
  }

  /**
   * 現在のウィンドウタイトルを取得する
   * @returns {string}
   */
  get windowTitle() {
    return this.name;
  }

  // ─── ライフサイクルフック (サブクラスでオーバーライド) ──────────────────────

  /** アプリ起動時に呼ばれる。querySelector() 使用可。 */
  initialize() {}

  /** ファイル関連付け等でファイルが開かれたとき @param {string} filePath */
  onOpenFile(_filePath) {}

  /** アプリ終了時に呼ばれる。タイマー解除などのクリーンアップを実装する。 */
  close() {}

  /** ウィンドウがフォーカスされたとき */
  onFocus() {}

  /** ウィンドウのフォーカスが外れたとき */
  onBlur() {}

  /** ウィンドウがリサイズされたとき @param {number} width @param {number} height */
  onResize(_width, _height) {}

  /** ウィンドウが最小化されたとき */
  onMinimize() {}

  /** ウィンドウが復元されたとき */
  onRestore() {}

  /** 別のアプリから IPC メッセージを受信したとき @param {*} data */
  onMessage(_data) {}

  #titleDispose = null;
  _customTitle  = false;

  /**
   * マニフェスト名に基づく自動タイトル同期を初期化する (内部利用)
   */
  _initTitleSync() {
    if (this._titleDispose) return;
    this._titleDispose = this.hamon.effect(() => {
      if (this._customTitle) return;
      const autoTitle = window.System?.i18n?.getAppName(this._manifest) || this.name;
      this.#applyTitle(autoTitle);
    });
  }

  /**
   * ウィンドウタイトルを変更する。
   * 文字列、関数 (getter)、Hamon Signal、または i18n 反映関数を渡すことが可能。
   * @param {string|Function|import('./hamon.js').Signal<string>} title
   */
  setTitle(title) {
    this._customTitle = true;
    if (this._titleDispose) {
      this._titleDispose();
      this._titleDispose = null;
    }

    if (typeof title === "function") {
      this._titleDispose = this.hamon.effect(() => {
        const val = title();
        this.#applyTitle(val);
      });
    } else if (title && typeof title === "object" && "value" in title) {
      this._titleDispose = this.hamon.effect(() => {
        const val = title.value;
        this.#applyTitle(val);
      });
    } else {
      this.#applyTitle(title);
    }
  }

  #applyTitle(title) {
    const str = String(title ?? "");
    this.name = str;
    this._windowElement?.setTitle(str);
    window.System?.events?.emit("app:titleChanged", { uuid: this._uuid, title: str });
  }

  /**
   * Shadow DOM 内の要素を取得する。
   * @param {string} selector
   * @returns {Element|null}
   */
  querySelector(selector) {
    return this._windowElement?.shadowRoot?.querySelector(selector) ?? null;
  }

  /**
   * Shadow DOM 内の要素をすべて取得する。
   * @param {string} selector
   * @returns {NodeList|null}
   */
  querySelectorAll(selector) {
    return this._windowElement?.shadowRoot?.querySelectorAll(selector) ?? null;
  }

  /**
   * 翻訳テキストを取得する (i18n)
   * アプリ短縮IDによる名前空間の自動補完 (例: this.t("title") -> "myapp.title") もサポート
   * @param {string} key
   * @param {Record<string, string|number>} [vars]
   * @returns {string}
   */
  t(key, vars) {
    if (!key) return "";
    const i18n = window.System?.i18n;
    if (!i18n) return key;

    // ドットを含まないキーの場合、アプリ自身の名前空間を優先して試行
    if (!key.includes(".") && this._manifest?.id) {
      const rawId = this._manifest.id.replace(/^eskit\./, "").replace(/^apps\//, "").replace(/\/$/, "");
      const candidates = [rawId];
      if (rawId.includes(".")) {
        candidates.push(rawId.split(".").pop());
      }
      for (const candidate of candidates) {
        const fullKey = `${candidate}.${key}`;
        const resolved = i18n.t(fullKey, vars);
        if (resolved !== fullKey) {
          return resolved;
        }
      }
    }

    return i18n.t(key, vars);
  }

  /**
   * ダイアログ (確認) を表示する
   * @param {Parameters<typeof window.System.dialog.confirm>[0]} opts
   * @returns {Promise<boolean>}
   */
  async confirm(opts) {
    return window.System?.dialog?.confirm(opts) ?? false;
  }

  /**
   * ダイアログ (アラート) を表示する
   * @param {Parameters<typeof window.System.dialog.alert>[0]} opts
   * @returns {Promise<void>}
   */
  async alert(opts) {
    return window.System?.dialog?.alert(opts);
  }

  /**
   * ダイアログ (入力) を表示する
   * @param {Parameters<typeof window.System.dialog.prompt>[0]} opts
   * @returns {Promise<string|null>}
   */
  async prompt(opts) {
    return window.System?.dialog?.prompt(opts) ?? null;
  }

  /**
   * ファイルピッカーダイアログを表示してファイルを選択する
   * @param {{ title?: string, startPath?: string, accepts?: string[] }} [opts]
   * @returns {Promise<string|null>} 選択されたファイルの絶対パス、またはキャンセルの場合 null
   */
  async showOpenFilePicker(opts) {
    return window.System?.showOpenFilePicker(opts) ?? null;
  }

  /**
   * 通知を表示する。権限 "notifications" が必要。
   * @param {{ title?: string, message?: string, type?: string, duration?: number, icon?: string, action?: { label: string, onClick?: () => void } }} opts
   */
  async showNotification(opts) {
    const system = window.System;
    if (!system) return;
    if (!await system.permissions.check(this._uuid, "notifications")) {
      console.warn(`[ESKitApp:${this.name}] Permission "notifications" denied`);
      return;
    }
    system.notify(opts);
  }

  /**
   * 別のアプリへ IPC メッセージを送信する。権限 "ipc" が必要。
   * @param {string} targetUuid  送信先アプリの UUID
   * @param {*} data
   */
  async sendMessage(targetUuid, data) {
    const system = window.System;
    if (!system) return;
    if (!await system.permissions.check(this._uuid, "ipc")) {
      throw new Error(`[ESKitApp:${this.name}] Permission "ipc" denied`);
    }
    system.sendMessage(targetUuid, data);
  }

  /**
   * 実行中のプロセス一覧を取得する。権限 "system.info" が必要。
   * @returns {Promise<{uuid: string, name: string, state: string}[]>}
   */
  async listProcesses() {
    const system = window.System;
    if (!system) return [];
    if (!await system.permissions.check(this._uuid, "system.info")) {
      throw new Error(`[ESKitApp:${this.name}] Permission "system.info" denied`);
    }
    return system.listProcesses();
  }

  #fs = null;

  /**
   * 権限検証付き仮想ファイルシステムファサードを取得する。
   * @returns {ESKitAppFS}
   */
  get fs() {
    if (!this.#fs) {
      this.#fs = new ESKitAppFS(this);
    }
    return this.#fs;
  }

  /**
   * Hamon スコープを取得する。初回アクセス時に遅延生成される。
   * @returns {import('./hamon.js').HamonScope}
   */
  get hamon() {
    if (!this._hamonScope) {
      // 遅延 import を避けるため、HamonScope を動的に生成
      // (system/hamon.js が読み込み済みならグローバルキャッシュから取得)
      this._hamonScope = new (globalThis.__HamonScope ?? _FallbackScope)();
    }
    return this._hamonScope;
  }
}

/**
 * アプリ用仮想ファイルシステムファサード
 * System.permissions.check() を通じて権限確認を行う。
 */
class ESKitAppFS {
  #app;

  constructor(app) {
    this.#app = app;
  }

  async #assert(permission) {
    const system = window.System;
    if (!system) throw new Error("System is not available");
    const granted = await system.permissions.check(this.#app._uuid, permission);
    if (!granted) {
      throw new Error(`[ESKitApp:${this.#app.name}] Permission "${permission}" denied`);
    }
    return system.fs;
  }

  async readFile(path) {
    const fs = await this.#assert("fs.read");
    return fs.readFile(path);
  }

  async readFileAsBytes(path) {
    const fs = await this.#assert("fs.read");
    return fs.readFileAsBytes(path);
  }

  async readdir(path) {
    const fs = await this.#assert("fs.read");
    return fs.readdir(path);
  }

  async stat(path) {
    const fs = await this.#assert("fs.read");
    return fs.stat(path);
  }

  async exists(path) {
    const fs = await this.#assert("fs.read");
    return fs.exists(path);
  }

  async writeFile(path, content) {
    const fs = await this.#assert("fs.write");
    return fs.writeFile(path, content);
  }

  async mkdir(path, opts) {
    const fs = await this.#assert("fs.write");
    return fs.mkdir(path, opts);
  }

  async remove(path, opts) {
    const fs = await this.#assert("fs.write");
    return fs.remove(path, opts);
  }

  async rename(oldPath, newPath) {
    const fs = await this.#assert("fs.write");
    return fs.rename(oldPath, newPath);
  }
}

/** HamonScope が読み込まれていない場合のフォールバック (互換用) */
class _FallbackScope {
  signal()   { throw new Error("Hamon is not loaded. Import 'system/hamon.js' first."); }
  computed() { throw new Error("Hamon is not loaded. Import 'system/hamon.js' first."); }
  effect()   { return () => {}; }
  dispose()  {}
  onDispose(){ }
}
