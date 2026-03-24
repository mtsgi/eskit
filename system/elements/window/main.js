import style    from "./style.js";
import template from "./template.js";

/**
 * ESKitWindowElement — アプリウィンドウ
 *
 * 属性:
 *   mode   — "desktop" | "mobile"  (レイアウト切替)
 *   active — mobile モードで全画面表示するかどうか (boolean)
 */
export default class ESKitWindowElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["mode", "active"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    // 属性変更は CSS :host([mode="?"]) / :host([active]) が制御
  }

  render() {
    this.shadowRoot.innerHTML = template;

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [styleSheet];
  }

  /**
   * ウィンドウタイトルを更新する。
   * @param {string} title
   */
  setTitle(title) {
    const el = this.shadowRoot?.querySelector(".app-title");
    if (el) el.textContent = title;
  }
}
