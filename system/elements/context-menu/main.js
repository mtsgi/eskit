import style from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitContextMenuElement — コンテキストメニュー
 *
 * Popover API (manual) を使った右クリックメニュー。
 * show(x, y, items) で任意の位置にメニューを表示する。
 *
 * items 形式:
 *   { label: string, action: () => void, icon?: string }
 *   { separator: true }
 */
export default class ESKitContextMenuElement extends HTMLElement {
  #menuEl = null;
  #itemsEl = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();

    this.#menuEl = this.shadowRoot.getElementById("menu");
    this.#itemsEl = this.shadowRoot.getElementById("menu-items");
  }

  disconnectedCallback() {
    document.removeEventListener("pointerdown", this.#onPointerDown, true);
    document.removeEventListener("keydown", this.#onKeyDown, true);
  }

  /**
   * メニューを表示する。
   * @param {number} x — clientX
   * @param {number} y — clientY
   * @param {{ label?: string, action?: () => void, icon?: string, separator?: boolean }[]} items
   */
  show(x, y, items) {
    this.#buildItems(items);
    this.#menuEl.showPopover();

    // 位置を仮設定してサイズを計測
    this.#menuEl.style.left = `0px`;
    this.#menuEl.style.top = `0px`;

    requestAnimationFrame(() => {
      const rect = this.#menuEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // 画面端補正
      let posX = x;
      let posY = y;
      if (posX + rect.width > vw) posX = vw - rect.width - 4;
      if (posY + rect.height > vh) posY = vh - rect.height - 4;
      if (posX < 0) posX = 4;
      if (posY < 0) posY = 4;

      this.#menuEl.style.left = `${posX}px`;
      this.#menuEl.style.top = `${posY}px`;
    });

    document.addEventListener("pointerdown", this.#onPointerDown, true);
    document.addEventListener("keydown", this.#onKeyDown, true);
  }

  /** メニューを閉じる。 */
  hide() {
    try {
      this.#menuEl.hidePopover();
    } catch { /* already hidden */ }
    document.removeEventListener("pointerdown", this.#onPointerDown, true);
    document.removeEventListener("keydown", this.#onKeyDown, true);
  }

  // ─── 内部処理 ──────────────────────────────────────────────────────────

  #buildItems(items) {
    this.#itemsEl.innerHTML = "";
    for (const item of items) {
      if (item.separator) {
        const sep = document.createElement("div");
        sep.className = "menu-separator";
        this.#itemsEl.appendChild(sep);
        continue;
      }
      const btn = document.createElement("button");
      btn.className = "menu-item";
      if (item.icon) {
        btn.innerHTML = `<span class="menu-item-icon">${this.#esc(item.icon)}</span>${this.#esc(item.label)}`;
      } else {
        btn.textContent = item.label;
      }
      btn.addEventListener("click", () => {
        this.hide();
        item.action?.();
      });
      this.#itemsEl.appendChild(btn);
    }
  }

  #onPointerDown = (e) => {
    // メニュー内のクリックは無視
    if (e.composedPath().includes(this.#menuEl)) return;
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

  #esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
