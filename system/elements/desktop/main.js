import style from "./style.js";

export default class ESKitDesktopElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `<slot></slot>`;

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [styleSheet];
  }
}
