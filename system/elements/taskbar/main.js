import style from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { HamonScope } from "system/hamon.js";

/**
 * ESKitTaskbarElement — デスクトップモード用タスクバー
 */
export default class ESKitTaskbarElement extends HTMLElement {
  #offOpened = null;
  #offClosed = null;
  #offFocused = null;
  #offTitleChanged = null;
  #offLocale = null;
  #clockTimer = null;
  #scope = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#scope = new HamonScope();
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
    this.#offLocale?.();
    this.#scope?.dispose();
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
    const frag = createTemplate(this.#scope);
    this.shadowRoot.replaceChildren(frag);
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  // ─── イベント ──────────────────────────────────────────────────────────

  #bindEvents() {
    this.shadowRoot.getElementById("launcher-btn")?.addEventListener("click", () => {
      window.System?.events.emit("launcher:toggle");
    });

    this.shadowRoot.getElementById("clock")?.addEventListener("click", () => {
      window.System?.WindowSystem?.quickSettings?.toggle();
    });

    const sys = window.System;
    if (!sys) return;

    this.#offOpened = sys.events.on("app:opened", ({ uuid, name, icon, manifest }) => {
      const displayName = manifest ? sys.i18n?.getAppName(manifest) : name;
      this.#addAppButton(uuid, displayName, icon);
    });

    this.#offClosed = sys.events.on("app:closed", ({ uuid }) => {
      this.#removeAppButton(uuid);
    });

    this.#offFocused = sys.events.on("app:focused", ({ uuid }) => {
      this.#setActive(uuid);
    });

    this.#offTitleChanged = sys.events.on("app:titleChanged", ({ uuid, title }) => {
      this.#updateAppButton(uuid, title);
    });

    this.#offLocale = sys.events.on("system:locale-changed", () => {
      this.#updateClock();
      this.#refreshAppButtons();
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

  #refreshAppButtons() {
    const procs = window.System?.listProcesses() || [];
    for (const proc of procs) {
      const app = window.System?.getApp(proc.uuid);
      const title = app?.name || proc.name;
      this.#updateAppButton(proc.uuid, title);
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
    el.textContent = window.System?.i18n?.formatTime(now) || now.toLocaleTimeString();
    el.title = window.System?.i18n?.formatDate(now) || now.toLocaleDateString();
  }
}
