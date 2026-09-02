import style from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { HamonScope } from "system/hamon.js";

/**
 * ESKitBeaconElement — グローバル検索オーバーレイ
 */
export default class ESKitBeaconElement extends HTMLElement {
  #inputEl = null;
  #resultsEl = null;
  #overlayEl = null;
  #selectedIndex = -1;
  #currentResults = [];
  #scope = null;
  #offLocale = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#scope = new HamonScope();
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#inputEl = this.shadowRoot.getElementById("beacon-input");
    this.#resultsEl = this.shadowRoot.getElementById("beacon-results");
    this.#overlayEl = this.shadowRoot.getElementById("overlay");
    this.#bindEvents();
  }

  disconnectedCallback() {
    this.#offLocale?.();
    this.#scope?.dispose();
  }

  get isOpen() {
    return this.hasAttribute("open");
  }

  show() {
    this.setAttribute("open", "");
    if (this.#inputEl) this.#inputEl.value = "";
    this.#selectedIndex = -1;
    this.#currentResults = [];
    this.#refresh("");
    requestAnimationFrame(() => this.#inputEl?.focus());
  }

  hide() {
    this.removeAttribute("open");
  }

  toggle() {
    this.isOpen ? this.hide() : this.show();
  }

  // ─── 内部処理 ──────────────────────────────────────────────────────────

  #refresh(query) {
    const sys = window.System;
    if (!sys) return;
    this.#currentResults = query
      ? sys.registry.search(query)
      : sys.registry.list();
    this.#selectedIndex = this.#currentResults.length > 0 ? 0 : -1;
    this.#renderResults();
  }

  #renderResults() {
    if (!this.#resultsEl) return;
    this.#resultsEl.innerHTML = "";
    if (this.#currentResults.length === 0) {
      const emptyText = window.System?.i18n?.t("system.noResults") || "候補が見つかりません";
      this.#resultsEl.innerHTML = `<p class="empty-message">${this.#esc(emptyText)}</p>`;
      return;
    }
    for (let i = 0; i < this.#currentResults.length; i++) {
      const manifest = this.#currentResults[i];
      const btn = document.createElement("button");
      btn.className = `result-item${i === this.#selectedIndex ? " -selected" : ""}`;

      const iconSpan = document.createElement("span");
      iconSpan.className = "result-icon";
      const iconEl = window.System?.icons?.createAppIcon(manifest.icon, { size: 18 });
      if (iconEl) iconSpan.appendChild(iconEl);

      const localizedName = window.System?.i18n?.getAppName(manifest) || manifest.name;
      const localizedDesc = window.System?.i18n?.getAppDescription(manifest) || manifest.description || manifest.id;

      const infoSpan = document.createElement("span");
      infoSpan.className = "result-info";
      infoSpan.innerHTML = `
        <span class="result-name">${this.#esc(localizedName)}</span>
        <span class="result-desc">${this.#esc(localizedDesc)}</span>
      `;

      btn.appendChild(iconSpan);
      btn.appendChild(infoSpan);
      btn.addEventListener("click", () => this.#launch(manifest));
      this.#resultsEl.appendChild(btn);
    }
  }

  #launch(manifest) {
    if (manifest._dir) {
      window.System?.loadApp(manifest._dir);
    }
    this.hide();
  }

  #updateSelection() {
    const items = this.#resultsEl?.querySelectorAll(".result-item") || [];
    items.forEach((el, i) => {
      el.classList.toggle("-selected", i === this.#selectedIndex);
    });
    items[this.#selectedIndex]?.scrollIntoView({ block: "nearest" });
  }

  #bindEvents() {
    this.#inputEl?.addEventListener("input", () => {
      this.#refresh(this.#inputEl.value.trim());
    });

    this.#inputEl?.addEventListener("keydown", (e) => {
      const len = this.#currentResults.length;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (len > 0) {
          this.#selectedIndex = (this.#selectedIndex + 1) % len;
          this.#updateSelection();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (len > 0) {
          this.#selectedIndex = (this.#selectedIndex - 1 + len) % len;
          this.#updateSelection();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (this.#selectedIndex >= 0 && this.#selectedIndex < len) {
          this.#launch(this.#currentResults[this.#selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.hide();
      }
    });

    this.#overlayEl?.addEventListener("click", (e) => {
      if (e.target === this.#overlayEl) this.hide();
    });

    this.#offLocale = window.System?.events?.on("system:locale-changed", () => {
      if (this.isOpen) {
        this.#refresh(this.#inputEl?.value.trim() || "");
      }
    });
  }

  #render() {
    const frag = createTemplate(this.#scope);
    this.shadowRoot.replaceChildren(frag);
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  #esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
