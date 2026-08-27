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
      permissions: Object.freeze([...(this._manifest.permissions || [])]),
    });
  }

  // ─── ライフサイクルフック (サブクラスでオーバーライド) ──────────────────────

  /** アプリ起動時に呼ばれる。querySelector() 使用可。 */
  initialize() {}

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

  // ─── 開発者 API ────────────────────────────────────────────────────────────

  /**
   * ウィンドウタイトルを変更する。
   * @param {string} title
   */
  setTitle(title) {
    this.name = title;
    this._windowElement?.setTitle(title);
    window.System?.events.emit("app:titleChanged", { uuid: this._uuid, title });
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
   * 通知を表示する。権限 "notifications" が必要。
   * @param {{ title?: string, message?: string, duration?: number }} opts
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
