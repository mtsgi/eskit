import style from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { HamonScope } from "system/hamon.js";

/**
 * ESKitQuickSettingsElement — クイック設定パネル
 *
 * タスクバーの時計クリックで開閉する Popover API パネル。
 * シェルモード切替・カラーモード切替・言語切替・通知数・プロセス数表示を提供する。
 */
export default class ESKitQuickSettingsElement extends HTMLElement {
  #panelEl = null;
  #offModeChanged = null;
  #offUserLoggedIn = null;
  #offUserLoggedOut = null;
  #offThemeChanged = null;
  #offLocaleChanged = null;
  #offNotificationsUpdated = null;
  #scope = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#scope = new HamonScope();
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#panelEl = this.shadowRoot.getElementById("panel");
    this.#bindEvents();
    this.#syncAll();
  }

  disconnectedCallback() {
    this.#offModeChanged?.();
    this.#offUserLoggedIn?.();
    this.#offUserLoggedOut?.();
    this.#offThemeChanged?.();
    this.#offLocaleChanged?.();
    this.#offNotificationsUpdated?.();
    this.#scope?.dispose();
    document.removeEventListener("pointerdown", this.#onPointerDown, true);
    document.removeEventListener("keydown", this.#onKeyDown, true);
  }

  get isOpen() {
    try {
      return this.#panelEl?.matches(":popover-open") ?? false;
    } catch {
      return false;
    }
  }

  /** パネルを開く */
  show() {
    this.#panelEl.classList.toggle("-mobile", window.System?.shellMode.isMobile ?? false);
    this.#syncAll();
    this.#panelEl.showPopover();
    document.addEventListener("pointerdown", this.#onPointerDown, true);
    document.addEventListener("keydown", this.#onKeyDown, true);
  }

  /** パネルを閉じる */
  hide() {
    try {
      this.#panelEl.hidePopover();
    } catch { /* already hidden */ }
    document.removeEventListener("pointerdown", this.#onPointerDown, true);
    document.removeEventListener("keydown", this.#onKeyDown, true);
  }

  /** 開閉トグル */
  toggle() {
    this.isOpen ? this.hide() : this.show();
  }

  // ─── 内部処理 ──────────────────────────────────────────────────────────

  #bindEvents() {
    // シェルモード切替
    const modeGroup = this.shadowRoot.getElementById("mode-group");
    modeGroup?.addEventListener("click", (e) => {
      const btn = e.target.closest(".mode-btn");
      if (!btn) return;
      const mode = btn.dataset.mode;
      if (mode === "auto") {
        window.System?.shellMode.unlock();
      } else {
        window.System?.setShellMode(mode);
      }
      this.#syncMode();
    });

    // テーマカラーモード切替
    const themeModeGroup = this.shadowRoot.getElementById("theme-mode-group");
    themeModeGroup?.addEventListener("click", (e) => {
      const btn = e.target.closest(".theme-mode-btn");
      if (!btn) return;
      const themeMode = btn.dataset.themeMode;
      window.System?.theme?.setMode(themeMode);
      this.#syncTheme();
    });

    // 言語切替
    const langGroup = this.shadowRoot.getElementById("lang-group");
    langGroup?.addEventListener("click", (e) => {
      const btn = e.target.closest(".lang-btn");
      if (!btn) return;
      const lang = btn.dataset.lang;
      window.System?.i18n?.setLocale(lang);
      this.#syncLang();
    });

    // 設定アプリを開く
    this.shadowRoot.getElementById("open-settings-btn")?.addEventListener("click", () => {
      this.hide();
      window.System?.loadApp("apps/settings/");
    });

    // ログアウト
    this.shadowRoot.getElementById("logout-btn")?.addEventListener("click", () => {
      this.hide();
      window.System?.logout();
    });

    // イベント購読
    const sys = window.System;
    if (sys) {
      this.#offModeChanged = sys.events.on("shell:mode-changed", () => this.#syncMode());
      this.#offUserLoggedIn = sys.events.on("user:logged-in", () => this.#updateUserInfo());
      this.#offUserLoggedOut = sys.events.on("user:logged-out", () => this.#updateUserInfo());
      this.#offThemeChanged = sys.events.on("system:theme-changed", () => this.#syncTheme());
      this.#offLocaleChanged = sys.events.on("system:locale-changed", () => {
        this.#syncLang();
        this.#updateUserInfo();
      });
      this.#offNotificationsUpdated = sys.events.on("notifications:updated", () => this.#updateNotificationCount());
      sys.events.on("notification:show", () => this.#updateNotificationCount());
    }

    this.#onPointerDown = this.#onPointerDown.bind(this);
    this.#onKeyDown = this.#onKeyDown.bind(this);
  }

  #syncAll() {
    this.#syncMode();
    this.#syncTheme();
    this.#syncLang();
    this.#updateUserInfo();
    this.#updateProcessCount();
    this.#updateNotificationCount();
  }

  #syncMode() {
    const shellMode = window.System?.shellMode;
    const activeKey = shellMode?.isLocked ? shellMode.current : "auto";
    const btns = this.shadowRoot.querySelectorAll(".mode-btn");
    for (const btn of btns) {
      btn.classList.toggle("-active", btn.dataset.mode === activeKey);
    }
  }

  #syncTheme() {
    const currentMode = window.System?.theme?.mode || "auto";
    const btns = this.shadowRoot.querySelectorAll(".theme-mode-btn");
    for (const btn of btns) {
      btn.classList.toggle("-active", btn.dataset.themeMode === currentMode);
    }
  }

  #syncLang() {
    const currentLang = window.System?.i18n?.current || "ja";
    const btns = this.shadowRoot.querySelectorAll(".lang-btn");
    for (const btn of btns) {
      btn.classList.toggle("-active", btn.dataset.lang === currentLang);
    }
  }

  #updateProcessCount() {
    const count = window.System?.listProcesses().length ?? 0;
    const el = this.shadowRoot.getElementById("process-count");
    if (el) el.textContent = count;
  }

  #updateNotificationCount() {
    const count = window.System?.notifications?.list().length ?? 0;
    const el = this.shadowRoot.getElementById("notification-count");
    if (el) {
      el.textContent = count;
      el.className = count > 0 ? "qs-value kit-badge -primary" : "qs-value kit-badge";
    }
  }

  #updateUserInfo() {
    const current = window.System?.currentUser;
    const el = this.shadowRoot.getElementById("current-user");
    if (!el) return;
    if (!current) {
      el.textContent = window.System?.i18n?.t("system.notLoggedIn") || "(未ログイン)";
      return;
    }
    el.textContent = `${current.name} (${current.id})${current.isAdmin ? " [admin]" : ""}`;
  }

  #onPointerDown = (e) => {
    if (e.composedPath().includes(this.#panelEl)) return;
    if (e.composedPath().some(el => el.id === "clock")) return;
    if (e.composedPath().some(el => el.id === "qs-btn")) return;
    this.hide();
  };

  #onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.hide();
    }
  };

  #render() {
    const frag = createTemplate(this.#scope);
    this.shadowRoot.replaceChildren(frag);
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }
}
