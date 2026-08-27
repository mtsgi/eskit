import style from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitTaskbarElement — デスクトップモード用タスクバー
 *
 * 画面下部に固定表示され、ランチャーボタン・起動中アプリ一覧・時計を表示する。
 * モバイルモードでは非表示 (ESKitHomeBarElement + ESKitDrawerElement が代替)。
 *
 * 属性:
 *   mode — "desktop" | "mobile"  (ESKitWindowSystem が設定)
 */
export default class ESKitTaskbarElement extends HTMLElement {
  #offOpened = null;
  #offClosed = null;
  #offFocused = null;
  #offTitleChanged = null;
  #clockTimer = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["mode"];
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
    this.#startClock();
  }

  disconnectedCallback() {
    this.#offOpened?.();
    this.#offClosed?.();
    this.#offFocused?.();
    this.#offTitleChanged?.();
    if (this.#clockTimer != null) {
      clearInterval(this.#clockTimer);
      this.#clockTimer = null;
    }
  }

  attributeChangedCallback() {
    // CSS :host([mode="mobile"]) が display を制御
  }

  // ─── 描画 ───────────────────────────────────────────────────────────────

  #render() {
    this.shadowRoot.innerHTML = template;
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  // ─── イベント ──────────────────────────────────────────────────────────

  #bindEvents() {
    // ランチャーボタン
    this.shadowRoot.getElementById("launcher-btn").addEventListener("click", () => {
      window.System?.events.emit("launcher:toggle");
    });

    // 時計クリック → クイック設定パネル
    this.shadowRoot.getElementById("clock").addEventListener("click", () => {
      window.System?.WindowSystem?.quickSettings?.toggle();
    });

    const sys = window.System;
    if (!sys) return;

    // アプリ起動 → ボタン追加
    this.#offOpened = sys.events.on("app:opened", ({ uuid, name, icon }) => {
      this.#addAppButton(uuid, name, icon);
    });

    // アプリ終了 → ボタン削除
    this.#offClosed = sys.events.on("app:closed", ({ uuid }) => {
      this.#removeAppButton(uuid);
    });

    // フォーカス変更 → ハイライト更新
    this.#offFocused = sys.events.on("app:focused", ({ uuid }) => {
      this.#setActive(uuid);
    });

    // タイトル変更 → ボタンテキスト更新
    this.#offTitleChanged = sys.events.on("app:titleChanged", ({ uuid, title }) => {
      this.#updateAppButton(uuid, title);
    });
  }

  // ─── アプリボタン管理 ─────────────────────────────────────────────────

  #addAppButton(uuid, name, icon) {
    const container = this.shadowRoot.getElementById("taskbar-apps");
    if (!container) return;

    const btn = document.createElement("button");
    btn.className = "app-btn";
    btn.dataset.uuid = uuid;

    const iconEl = window.System?.icons?.createAppIcon(icon, { size: 16 });
    if (iconEl) btn.appendChild(iconEl);

    const label = document.createElement("span");
    label.className = "app-btn-label";
    label.textContent = name;
    btn.appendChild(label);

    btn.addEventListener("click", () => {
      window.System?.WindowSystem?.activateWindow(uuid);
    });
    container.appendChild(btn);

    // 新規起動はアクティブ扱い
    this.#setActive(uuid);
  }

  #removeAppButton(uuid) {
    const container = this.shadowRoot.getElementById("taskbar-apps");
    if (!container) return;
    const btn = container.querySelector(`[data-uuid="${CSS.escape(uuid)}"]`);
    btn?.remove();
  }

  #updateAppButton(uuid, title) {
    const container = this.shadowRoot.getElementById("taskbar-apps");
    if (!container) return;
    const btn = container.querySelector(`[data-uuid="${CSS.escape(uuid)}"]`);
    if (btn) {
      const label = btn.querySelector(".app-btn-label");
      if (label) {
        label.textContent = title;
      } else {
        btn.textContent = title;
      }
    }
  }

  #setActive(uuid) {
    const container = this.shadowRoot.getElementById("taskbar-apps");
    if (!container) return;
    for (const btn of container.querySelectorAll(".app-btn")) {
      btn.classList.toggle("-active", btn.dataset.uuid === uuid);
    }
  }

  // ─── 時計 ─────────────────────────────────────────────────────────────

  #startClock() {
    this.#updateClock();
    this.#clockTimer = setInterval(() => this.#updateClock(), 10_000);
  }

  #updateClock() {
    const el = this.shadowRoot.getElementById("clock");
    if (!el) return;
    const now = new Date();
    el.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
}
