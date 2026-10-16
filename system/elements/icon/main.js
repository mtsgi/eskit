import style from "./style.js";

/**
 * ESKitIconElement (`<eskit-icon>`) — アイコン表示用 Web Component
 *
 * 属性:
 *   set          — アイコンセット名 (デフォルト: "lucide")
 *   name         — アイコン名 (例: "search", "terminal")
 *   size         — 表示サイズ (数値または単位付き文字列。例: "18", "1.5rem")
 *   stroke-width — 線の太さ (デフォルト: 2)
 *   color        — アイコン色 (デフォルト: currentColor)
 */
export default class ESKitIconElement extends HTMLElement {
  static get observedAttributes() {
    return ["set", "name", "size", "stroke-width", "color"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.#render();
  }

  #render() {
    const set = this.getAttribute("set") || "lucide";
    const name = this.getAttribute("name");
    const size = this.getAttribute("size");
    const strokeWidth = this.getAttribute("stroke-width") || "2";
    const color = this.getAttribute("color");

    // サイズスタイルの適用
    if (size) {
      const sizeVal = /^\d+(\.\d+)?$/.test(size.trim()) ? `${size}px` : size;
      this.style.width = sizeVal;
      this.style.height = sizeVal;
    } else {
      this.style.removeProperty("width");
      this.style.removeProperty("height");
    }

    // カラースタイルの適用
    if (color) {
      this.style.color = color;
    } else {
      this.style.removeProperty("color");
    }

    if (!name) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    // アイコン SVG 内部コンテンツを取得
    let svgInner = window.System?.icons?.get(set, name);

    if (svgInner === null || svgInner === undefined) {
      // フォールバック: help-circle を試行
      svgInner = window.System?.icons?.get("lucide", "help-circle") || "";
      if (window.System?.icons) {
        console.warn(`[eskit-icon] Icon not found: set="${set}", name="${name}"`);
      }
    }

    this.shadowRoot.innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        ${svgInner}
      </svg>
    `;
  }
}
