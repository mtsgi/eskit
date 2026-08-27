import style from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitBeaconElement — グローバル検索オーバーレイ
 *
 * Ctrl+Space (Mac: Cmd+Space) でトグルし、レジストリのアプリを
 * リアルタイム検索・起動できる。
 *
 * 属性:
 *   open — オーバーレイ表示中 (boolean attribute)
 */
export default class ESKitBeaconElement extends HTMLElement {
  #inputEl = null;
  #resultsEl = null;
  #overlayEl = null;
  #selectedIndex = -1;
  #currentResults = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#inputEl = this.shadowRoot.getElementById("beacon-input");
    this.#resultsEl = this.shadowRoot.getElementById("beacon-results");
    this.#overlayEl = this.shadowRoot.getElementById("overlay");
    this.#bindEvents();
  }

  get isOpen() {
    return this.hasAttribute("open");
  }

  /** スポットライトを開く */
  show() {
    this.setAttribute("open", "");
    this.#inputEl.value = "";
    this.#selectedIndex = -1;
    this.#currentResults = [];
    this.#refresh("");
    requestAnimationFrame(() => this.#inputEl.focus());
  }

  /** スポットライトを閉じる */
  hide() {
    this.removeAttribute("open");
  }

  /** 開閉トグル */
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
    this.#resultsEl.innerHTML = "";
    if (this.#currentResults.length === 0) {
      this.#resultsEl.innerHTML = `<p class="empty-message">候補が見つかりません</p>`;
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

      const infoSpan = document.createElement("span");
      infoSpan.className = "result-info";
      infoSpan.innerHTML = `
        <span class="result-name">${this.#esc(manifest.name)}</span>
        <span class="result-desc">${this.#esc(manifest.description || manifest.id)}</span>
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
    const items = this.#resultsEl.querySelectorAll(".result-item");
    items.forEach((el, i) => {
      el.classList.toggle("-selected", i === this.#selectedIndex);
    });
    // スクロールして見える位置に
    items[this.#selectedIndex]?.scrollIntoView({ block: "nearest" });
  }

  #bindEvents() {
    // 検索入力
    this.#inputEl.addEventListener("input", () => {
      this.#refresh(this.#inputEl.value.trim());
    });

    // キーボード操作
    this.#inputEl.addEventListener("keydown", (e) => {
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

    // オーバーレイ背景クリックで閉じる
    this.#overlayEl.addEventListener("click", (e) => {
      if (e.target === this.#overlayEl) this.hide();
    });
  }

  #render() {
    this.shadowRoot.innerHTML = template;
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
