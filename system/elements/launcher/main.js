import style from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { HamonScope } from "system/hamon.js";

/**
 * ESKitLauncherElement — デスクトップモード用ランチャー
 */
export default class ESKitLauncherElement extends HTMLElement {
  #offToggle = null;
  #offLocale = null;
  #scope = null;
  #searchQuery = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#scope = new HamonScope();
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
  }

  disconnectedCallback() {
    this.#offToggle?.();
    this.#offLocale?.();
    this.#scope?.dispose();
  }

  get isOpen() {
    return this.hasAttribute("open");
  }

  show() {
    this.classList.remove("is-closing");
    this.#searchQuery = "";
    this.#refresh();
    this.setAttribute("open", "");
    const input = this.shadowRoot.getElementById("launcher-search");
    if (input) {
      input.value = "";
      requestAnimationFrame(() => input.focus());
    }
  }

  hide() {
    if (!this.isOpen || this.classList.contains("is-closing")) return;
    this.classList.add("is-closing");
    const panel = this.shadowRoot.querySelector(".launcher-panel");
    const done = () => {
      this.removeAttribute("open");
      this.classList.remove("is-closing");
      panel?.removeEventListener("animationend", done);
    };
    panel?.addEventListener("animationend", done, { once: true });
  }

  toggle() {
    this.isOpen ? this.hide() : this.show();
  }

  // ─── 内容の更新 ────────────────────────────────────────────────────────────

  #refresh(query = this.#searchQuery) {
    this.#searchQuery = query;
    const sys = window.System;
    if (!sys) return;
    const manifests = query
      ? sys.registry.search(query)
      : sys.registry.list();
    this.#renderGrid(manifests);
  }

  #renderGrid(manifests) {
    const grid = this.shadowRoot.getElementById("launcher-grid");
    if (!grid) return;
    grid.innerHTML = "";

    if (manifests.length === 0) {
      const emptyText = window.System?.i18n?.t("system.noResults") || "アプリが見つかりません";
      grid.innerHTML = `<p class="empty-message">${this.#esc(emptyText)}</p>`;
      return;
    }

    for (const manifest of manifests) {
      const btn = document.createElement("button");
      btn.className = "app-card";

      const iconSpan = document.createElement("span");
      iconSpan.className = "app-icon";
      const iconEl = window.System?.icons?.createAppIcon(manifest.icon, { size: 32 });
      if (iconEl) iconSpan.appendChild(iconEl);

      const nameSpan = document.createElement("span");
      nameSpan.className = "app-name";
      nameSpan.textContent = window.System?.i18n?.getAppName(manifest) || manifest.name;

      btn.appendChild(iconSpan);
      btn.appendChild(nameSpan);

      btn.addEventListener("click", async () => {
        if (manifest._dir) {
          await window.System?.loadApp(manifest._dir);
        }
        this.hide();
      });
      grid.appendChild(btn);
    }
  }

  // ─── レンダリング ─────────────────────────────────────────────────────────

  #render() {
    const frag = createTemplate(this.#scope);
    this.shadowRoot.replaceChildren(frag);
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  #bindEvents() {
    this.addEventListener("click", e => {
      if (e.target === this) this.hide();
    });

    this.shadowRoot.getElementById("launcher-search")?.addEventListener("input", e => {
      this.#refresh(e.target.value.trim());
    });

    const sys = window.System;
    if (sys) {
      this.#offToggle = sys.events.on("launcher:toggle", () => this.toggle());
      this.#offLocale = sys.events.on("system:locale-changed", () => {
        this.#refresh();
      });
    }
  }

  #esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
