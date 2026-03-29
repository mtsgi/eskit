import ESKitWindowSystem from "./window.js";
import ESKitEventBus    from "./event-bus.js";
import ESKitFileSystem  from "./filesystem.js";
import ESKitRegistry    from "./registry.js";
import ESKitPermissions from "./permissions.js";
import ESKitShellMode   from "./shell-mode.js";

/**
 * ESKitSystem — OS カーネル相当のシステムクラス
 *
 * window.System としてグローバルに公開される。
 * constructor() → #boot() (async) の順で初期化し、
 * 完了後に "system:ready" イベントを発行する。
 */
export default class ESKitSystem {
  #process      = new Map(); // uuid → ESKitApp
  #zIndex       = 100;
  #readyPromise;

  events      = new ESKitEventBus();
  fs          = new ESKitFileSystem();
  registry    = new ESKitRegistry();
  permissions = new ESKitPermissions();
  shellMode   = new ESKitShellMode();

  constructor() {
    window.System      = this;
    this.#readyPromise = this.#boot();
  }

  /** ブート完了を待てる Promise */
  get ready() {
    return this.#readyPromise;
  }

  // ─── 起動シーケンス ─────────────────────────────────────────────────────

  async #boot() {
    await this.fs.init();
    await this.#initDefaultDirs();
    this.WindowSystem = new ESKitWindowSystem();
    await this.#registerBuiltinApps();
    this.initUI();
    this.events.emit("system:ready");
  }

  async #initDefaultDirs() {
    const dirs = ["/home", "/home/user", "/home/user/desktop", "/system", "/apps"];
    for (const dir of dirs) {
      await this.fs.mkdir(dir, { recursive: true });
    }
  }

  async #registerBuiltinApps() {
    const builtin = ["apps/test/", "apps/welcome/"];
    for (const dir of builtin) {
      try {
        await this.registry.register(dir);
      } catch (e) {
        console.warn(`[ESKitSystem] Could not register built-in app "${dir}":`, e);
      }
    }
  }

  // ─── シェルモード ──────────────────────────────────────────────────────────

  /**
   * シェルモードを明示的に切り替える。
   * @param {"desktop"|"mobile"} mode
   */
  setShellMode(mode) {
    this.shellMode.set(mode);
  }

  // ─── シェル UI (Phase 3 で実装) ────────────────────────────────────────────

  initUI() {}

  // ─── アプリ ライフサイクル ─────────────────────────────────────────────────

  /**
   * アプリを起動する。
   * @param {string} appDir  末尾スラッシュ付きのディレクトリ (例: "apps/myapp/")
   * @returns {Promise<string>}  UUID
   */
  async loadApp(appDir) {
    await this.#readyPromise;

    const dir = appDir.endsWith("/") ? appDir : appDir + "/";

    let manifest = this.registry.getByDir(dir);
    if (!manifest) {
      manifest = await this.registry.register(dir);
    }

    const uuid = this.generateUUID();

    const module   = await import(dir + manifest.entry);
    const AppClass = module.default;
    const app      = new AppClass();

    app._uuid     = uuid;
    app._manifest = manifest;
    app._state    = "running";

    this.#process.set(uuid, app);
    this.permissions.registerApp(uuid, manifest);

    const windowElement = this.WindowSystem.open(uuid);
    app._windowElement  = windowElement;

    app.initialize();
    this.events.emit("app:opened", { uuid, name: app.name });

    return uuid;
  }

  /**
   * アプリを終了する。
   * @param {string} uuid
   */
  closeApp(uuid) {
    const app = this.getApp(uuid);
    if (!app) return;

    app.close();
    app._state = "closed";
    // WindowSystem.close() が activeUuid をリセットする前に記録する
    const wasActive = this.WindowSystem.activeUuid === uuid;
    this.WindowSystem.close(uuid);
    this.permissions.revoke(uuid);
    this.#process.delete(uuid);
    this.events.emit("app:closed", { uuid });

    // モバイルモードではアクティブアプリが閉じられたらドロワーを開く
    if (this.shellMode.isMobile && wasActive) {
      this.WindowSystem.drawer?.open();
    }
  }

  /**
   * UUID からアプリインスタンスを取得する。
   * @param {string} uuid
   * @returns {ESKitApp|null}
   */
  getApp(uuid) {
    return this.#process.get(uuid) ?? null;
  }

  /**
   * 実行中のプロセス一覧を返す。
   * @returns {{uuid: string, name: string, state: string}[]}
   */
  listProcesses() {
    return [...this.#process.entries()].map(([uuid, app]) => ({
      uuid,
      name:  app.name,
      state: app._state,
    }));
  }

  // ─── ユーティリティ ────────────────────────────────────────────────────────

  /**
   * ウィンドウフォーカス用の z-index を返す (呼ぶたびに増加)。
   * @returns {number}
   */
  nextZIndex() {
    return ++this.#zIndex;
  }

  /**
   * 通知を発行する。
   * @param {{ title?: string, message?: string, duration?: number }} opts
   */
  notify(opts) {
    this.events.emit("notification:show", opts);
  }

  /**
   * 別のアプリへ IPC メッセージを送信する。
   * @param {string} targetUuid  送信先アプリの UUID
   * @param {*} data
   */
  sendMessage(targetUuid, data) {
    this.getApp(targetUuid)?.onMessage(data);
  }

  /**
   * UUID を生成する。
   * @returns {string}
   */
  generateUUID() {
    return crypto.randomUUID();
  }
}
