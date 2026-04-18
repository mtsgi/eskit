import style from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitQuickSettingsElement — クイック設定パネル
 *
 * タスクバーの時計クリックで開閉する Popover API パネル。
 * シェルモード切替・プロセス数表示を提供する。
 * テーマ・言語設定は Phase 5 で有効化。
 */
export default class ESKitQuickSettingsElement extends HTMLElement {
  #panelEl = null;
  #offModeChanged = null;
  #offUserLoggedIn = null;
  #offUserLoggedOut = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#panelEl = this.shadowRoot.getElementById("panel");
    this.#bindEvents();
    this.#syncMode();
  }

  disconnectedCallback() {
    this.#offModeChanged?.();
    this.#offUserLoggedIn?.();
    this.#offUserLoggedOut?.();
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
    // モバイルモード判定: -mobile クラスで CSS が切り替わる
    this.#panelEl.classList.toggle("-mobile", window.System?.shellMode.isMobile ?? false);
    this.#syncMode();
    this.#updateUserInfo();
    this.#updateProcessCount();
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
    // モード切替ボタン
    const modeGroup = this.shadowRoot.getElementById("mode-group");
    modeGroup.addEventListener("click", (e) => {
      const btn = e.target.closest(".mode-btn");
      if (!btn) return;
      const mode = btn.dataset.mode;
      if (mode === "auto") {
        // MediaQuery 自動検出に戻す
        window.System?.shellMode.unlock();
      } else {
        window.System?.setShellMode(mode);
      }
      // unlock 時はモードが変わらずイベントが来ない場合があるため即時同期
      this.#syncMode();
    });

    this.shadowRoot.getElementById("logout-btn").addEventListener("click", () => {
      this.hide();
      window.System?.logout();
    });

    // モード変更イベントの購読
    const sys = window.System;
    if (sys) {
      this.#offModeChanged = sys.events.on("shell:mode-changed", () => {
        this.#syncMode();
      });
      this.#offUserLoggedIn = sys.events.on("user:logged-in", () => {
        this.#updateUserInfo();
      });
      this.#offUserLoggedOut = sys.events.on("user:logged-out", () => {
        this.#updateUserInfo();
      });
    }

    this.#onPointerDown = this.#onPointerDown.bind(this);
    this.#onKeyDown = this.#onKeyDown.bind(this);
  }

  #syncMode() {
    const shellMode = window.System?.shellMode;
    // isLocked: 手動で desktop/mobile が固定されている → 該当ボタンをハイライト
    // !isLocked: MediaQuery 自動検出中 → "auto" ボタンをハイライト
    const activeKey = shellMode?.isLocked ? shellMode.current : "auto";
    const btns = this.shadowRoot.querySelectorAll(".mode-btn");
    for (const btn of btns) {
      btn.classList.toggle("-active", btn.dataset.mode === activeKey);
    }
  }

  #updateProcessCount() {
    const count = window.System?.listProcesses().length ?? 0;
    const el = this.shadowRoot.getElementById("process-count");
    if (el) el.textContent = count;
  }

  #updateUserInfo() {
    const current = window.System?.currentUser;
    const el = this.shadowRoot.getElementById("current-user");
    if (!el) return;
    if (!current) {
      el.textContent = "(未ログイン)";
      return;
    }
    el.textContent = `${current.name} (${current.id})${current.isAdmin ? " [admin]" : ""}`;
  }

  #onPointerDown = (e) => {
    if (e.composedPath().includes(this.#panelEl)) return;
    // タスクバーの時計クリックは toggle で処理されるので除外
    if (e.composedPath().some(el => el.id === "clock")) return;
    // ドロワーのクイック設定ボタンは close+toggle 側で処理
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
    this.shadowRoot.innerHTML = template;
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }
}
