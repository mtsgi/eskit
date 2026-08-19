import ESKitWindowSystem from "./window.js";
import ESKitEventBus    from "./event-bus.js";
import ESKitFileSystem  from "./filesystem.js";
import ESKitRegistry    from "./registry.js";
import ESKitPermissions from "./permissions.js";
import ESKitShellMode   from "./shell-mode.js";
import ESKitUsers       from "./users.js";
import ESKitLoginScreenElement from "./elements/login-screen/main.js";

if (!customElements.get("eskit-login-screen")) {
  customElements.define("eskit-login-screen", ESKitLoginScreenElement);
}

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
  #loginScreen  = null;

  events      = new ESKitEventBus();
  fs          = new ESKitFileSystem();
  registry    = new ESKitRegistry();
  permissions = new ESKitPermissions();
  shellMode   = new ESKitShellMode();
  users       = new ESKitUsers();

  constructor() {
    window.System      = this;
    this.#readyPromise = this.#boot();
  }

  /** ブート完了を待てる Promise */
  get ready() {
    return this.#readyPromise;
  }

  /** 現在ログイン中のユーザー */
  get currentUser() {
    return this.users.getCurrent();
  }

  // ─── 起動シーケンス ─────────────────────────────────────────────────────

  async #boot() {
    await this.fs.init();
    await this.users.init();
    await this.#initBaseDirs();
    await this.#ensureDefaultAdmin();
    const user = await this.#ensureLogin();
    await this.#initCurrentUserDirs(user.id);
    this.WindowSystem = new ESKitWindowSystem();
    await this.#registerBuiltinApps();
    this.initUI();
    this.events.emit("system:ready", { user });
  }

  async #initBaseDirs() {
    const dirs = ["/home", "/shared", "/system", "/apps"];
    for (const dir of dirs) {
      await this.fs.mkdir(dir, { recursive: true });
    }
  }

  async #initCurrentUserDirs(userId) {
    const dirs = [
      `/home/${userId}`,
      `/home/${userId}/desktop`,
      `/home/${userId}/documents`,
      `/home/${userId}/.config`,
    ];
    for (const dir of dirs) {
      await this.fs.mkdir(dir, { recursive: true });
    }
  }

  async #ensureDefaultAdmin() {
    if (this.users.hasUsers()) return;
    try {
      const admin = await this.users.create({
        id: "admin",
        name: "Administrator",
        password: "",
        isAdmin: true,
      });
      this.events.emit("user:created", { user: admin });
      // 初回起動時は自動ログイン
      await this.users.login(admin.id, "");
    } catch (e) {
      console.error("[ESKitSystem] Failed to create default admin user:", e);
    }
  }

  async #ensureLogin() {
    const current = this.currentUser;
    if (current) {
      this.#getLoginScreen().hide();
      this.events.emit("user:logged-in", { user: current });
      return current;
    }

    const loginScreen = this.#getLoginScreen();
    let lastError = "";

    while (true) {
      const creds = await loginScreen.requestLogin(this.users.list(), lastError);
      try {
        const user = await this.users.login(creds.id, creds.password);
        loginScreen.hide();
        this.events.emit("user:logged-in", { user });
        return user;
      } catch (e) {
        lastError = e?.message ?? String(e);
      }
    }
  }

  #getLoginScreen() {
    if (this.#loginScreen) return this.#loginScreen;
    this.#loginScreen = document.createElement("eskit-login-screen");
    document.body.appendChild(this.#loginScreen);
    return this.#loginScreen;
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

  // ─── シェル UI ─────────────────────────────────────────────────────────────

  initUI() {
    // コンテキストメニュー: デスクトップ右クリック
    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const cm = this.WindowSystem?.contextMenu;
      if (!cm) return;
      cm.show(e.clientX, e.clientY, [
        this.shellMode.isMobile
          ? {
              icon: "💠",
              label: "ドロワーを開く",
              action: () => this.WindowSystem?.drawer?.toggle(),
            }
          : {
              icon: "💠",
              label: "ランチャーを開く",
              action: () => this.events.emit("launcher:toggle"),
            },
        { separator: true },
        {
          icon: "🔍",
          label: "検索",
          action: () => this.WindowSystem?.beacon?.toggle(),
        },
        { separator: true },
        {
          icon: "🔄",
          label: `${this.shellMode.isMobile ? "Desktop" : "Mobile"} モードに切替`,
          action: () => this.setShellMode(this.shellMode.isMobile ? "desktop" : "mobile"),
        },
      ]);
    });

    // グローバルキーバインド: Ctrl+Space / Cmd+Space でスポットライト
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.WindowSystem?.beacon?.toggle();
      }
    });
  }

  // ─── アプリ ライフサイクル ─────────────────────────────────────────────────

  /**
   * アプリを起動する。
   * @param {string} appDir  末尾スラッシュ付きのディレクトリ (例: "apps/myapp/")
   * @returns {Promise<string>}  UUID
   */
  async loadApp(appDir) {
    await this.#readyPromise;

    if (!this.currentUser) {
      throw new Error("[ESKitSystem] Cannot load app without an active user session");
    }

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
    app._hamonScope?.dispose();
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

  /** 現在ユーザーのホームディレクトリを返す */
  homeDir(userId = this.currentUser?.id) {
    return userId ? `/home/${userId}` : null;
  }

  /** ログアウトしてログイン画面へ戻る */
  logout() {
    for (const uuid of [...this.#process.keys()]) {
      this.closeApp(uuid);
    }
    const previous = this.currentUser;
    this.users.logout();
    this.events.emit("user:logged-out", { user: previous });
    location.reload();
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
