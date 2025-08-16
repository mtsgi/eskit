import style from "./style.js";

export default class ESKitWindowElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="app-header">
        App
      </div>
    `;

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [styleSheet];
  }
}
