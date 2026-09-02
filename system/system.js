import ESKitWindowSystem from "./window.js";
import ESKitEventBus    from "./event-bus.js";
import ESKitFileSystem  from "./filesystem.js";
import ESKitRegistry    from "./registry.js";
import ESKitPermissions from "./permissions.js";
import ESKitShellMode   from "./shell-mode.js";
import ESKitUsers       from "./users.js";
import ESKitIcons       from "./icons.js";
import ESKitTheme       from "./theme.js";
import ESKitI18n        from "./i18n.js";
import ESKitLoginScreenElement from "./elements/login-screen/main.js";
import ESKitIconElement        from "./elements/icon/main.js";
import ESKitDialogElement      from "./elements/dialog/main.js";
import ESKitNotificationContainerElement, { ESKitNotificationElement } from "./elements/notification/main.js";

if (!customElements.get("eskit-icon")) {
  customElements.define("eskit-icon", ESKitIconElement);
}

if (!customElements.get("eskit-login-screen")) {
  customElements.define("eskit-login-screen", ESKitLoginScreenElement);
}

if (!customElements.get("eskit-dialog")) {
  customElements.define("eskit-dialog", ESKitDialogElement);
}

if (!customElements.get("eskit-notification")) {
  customElements.define("eskit-notification", ESKitNotificationElement);
}

if (!customElements.get("eskit-notification-container")) {
  customElements.define("eskit-notification-container", ESKitNotificationContainerElement);
}

/**
 * ESKitNotificationsStore — 通知履歴・センター管理
 */
class ESKitNotificationsStore {
  #items = [];
  #maxItems = 50;

  list() {
    return [...this.#items];
  }

  add(opts) {
    const item = {
      id: crypto.randomUUID(),
      title: opts.title || window.System?.i18n?.t("notifications.title") || "Notification",
      message: opts.message || "",
      type: opts.type || "info",
      icon: opts.icon || null,
      time: Date.now(),
      read: false,
    };
    this.#items.unshift(item);
    if (this.#items.length > this.#maxItems) {
      this.#items.length = this.#maxItems;
    }
    return item;
  }

  clear() {
    this.#items = [];
    window.System?.events?.emit("notifications:updated");
  }

  markAllRead() {
    for (const it of this.#items) it.read = true;
    window.System?.events?.emit("notifications:updated");
  }

  get unreadCount() {
    return this.#items.filter(it => !it.read).length;
  }
}

/**
 * ESKitSystem — OS カーネル相当のシステムクラス
 *
 * window.System としてグローバルに公開される。
 * constructor() → #boot() (async) の順で初期化し、
 * 完了後に "system:ready" イベントを発行する。
 */
export default class ESKitSystem {
  #process               = new Map(); // uuid → ESKitApp
  #zIndex                = 100;
  #readyPromise;
  #loginScreen           = null;
  #dialogElement         = null;
  #notificationContainer = null;

  events        = new ESKitEventBus();
  fs            = new ESKitFileSystem();
  registry      = new ESKitRegistry();
  permissions   = new ESKitPermissions();
  shellMode     = new ESKitShellMode();
  users         = new ESKitUsers();
  icons         = new ESKitIcons();
  theme         = new ESKitTheme();
  i18n          = new ESKitI18n();
  notifications = new ESKitNotificationsStore();

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

  /** 汎用ダイアログファサード */
  get dialog() {
    return this.#getDialogElement();
  }

  // ─── 起動シーケンス ─────────────────────────────────────────────────────

  async #boot() {
    await this.fs.init();
    await this.users.init();
    await this.#initBaseDirs();
    await this.#ensureDefaultAdmin();
    const user = await this.#ensureLogin();
    await this.#initCurrentUserDirs(user.id);
    await this.theme.init();
    await this.i18n.init();
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

  #getDialogElement() {
    if (this.#dialogElement) return this.#dialogElement;
    this.#dialogElement = document.createElement("eskit-dialog");
    document.body.appendChild(this.#dialogElement);
    return this.#dialogElement;
  }

  #getNotificationContainer() {
    if (this.#notificationContainer) return this.#notificationContainer;
    this.#notificationContainer = document.createElement("eskit-notification-container");
    document.body.appendChild(this.#notificationContainer);
    return this.#notificationContainer;
  }

  async #registerBuiltinApps() {
    const builtin = ["apps/test/", "apps/welcome/", "apps/eskish/", "apps/settings/"];
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
   * シェルモードを明示的に切り替える。"auto" の場合は自動検出に復帰する。
   * @param {"desktop"|"mobile"|"auto"} mode
   */
  setShellMode(mode) {
    if (mode === "auto") {
      this.shellMode.unlock();
      return;
    }
    this.shellMode.set(mode);
  }

  // ─── シェル UI ─────────────────────────────────────────────────────────────

  initUI() {
    // 通知コンテナ & ダイアログの初期化マウント
    this.#getNotificationContainer();
    this.#getDialogElement();

    // コンテキストメニュー: デスクトップ右クリック
    window.addEventListener("contextmenu", (e) => {
      if (e.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.target.closest("eskit-window")) return;

      e.preventDefault();
      const cm = this.WindowSystem?.contextMenu;
      if (!cm) return;
      cm.show(e.clientX, e.clientY, [
        this.shellMode.isMobile
          ? {
              icon: { set: "lucide", name: "monitor-smartphone" },
              label: this.i18n.t("system.openDrawer"),
              action: () => this.WindowSystem?.drawer?.toggle(),
            }
          : {
              icon: { set: "lucide", name: "boxes" },
              label: this.i18n.t("system.openLauncher"),
              action: () => this.events.emit("launcher:toggle"),
            },
        { separator: true },
        {
          icon: { set: "lucide", name: "search" },
          label: this.i18n.t("system.beacon"),
          action: () => this.WindowSystem?.beacon?.toggle(),
        },
        {
          icon: { set: "lucide", name: "settings" },
          label: this.i18n.t("system.openSettings"),
          action: () => this.loadApp("apps/settings/"),
        },
        { separator: true },
        {
          icon: { set: "lucide", name: "refresh-cw" },
          label: `${this.shellMode.isMobile ? this.i18n.t("system.desktopMode") : this.i18n.t("system.mobileMode")} ${this.i18n.t("system.switchMode")}`,
          action: () => this.setShellMode(this.shellMode.isMobile ? "desktop" : "mobile"),
        },
      ]);
    });

    // グローバルキーバインド: Ctrl+Space / Cmd+Space でスポットライト
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && (e.ctrlKey || e.metaKey)) {
        if (e.target.closest("input, textarea, select, [contenteditable='true']")) return;
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
    this.events.emit("app:opened", { uuid, name: app.name, icon: app._manifest?.icon ?? null });

    return uuid;
  }

  /**
   * アプリを終了する。
   * @param {string} uuid
   */
  closeApp(uuid) {
    const app = this.getApp(uuid);
    if (!app) return;

    try {
      app.close();
    } catch (e) {
      console.error(`[ESKitSystem] Error during app.close() for ${uuid}:`, e);
    } finally {
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
      icon:  app._manifest?.icon ?? null,
      state: app._state,
    }));
  }

  /**
   * 登録済みの全アプリマニフェスト一覧を返す。
   * @returns {Manifest[]}
   */
  listApps() {
    return this.registry.list();
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
   * @param {{ title?: string, message?: string, type?: string, duration?: number, icon?: string, action?: { label: string, onClick?: () => void } }} opts
   */
  notify(opts) {
    if (!opts) return;
    const item = this.notifications.add(opts);
    this.events.emit("notification:show", { ...opts, id: item.id });
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
