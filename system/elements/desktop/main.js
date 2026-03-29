import style from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitDesktopElement — デスクトップルート要素
 *
 * 属性:
 *   mode — "desktop" | "mobile"  (ESKitWindowSystem が設定)
 */
export default class ESKitDesktopElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["mode"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    // CSS :host([mode="?"]) がレイアウトを制御するため、JS 側の追加指示は不要
  }

  render() {
    this.shadowRoot.innerHTML = template;

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, styleSheet];
  }
}
