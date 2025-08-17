import style from "./style.js";

export default class ESKitLauncherElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <input type="text" id="launcher-app-path" value="apps/welcome/main.js">
      <button id="launcher-load-app">Load</button>
    `;

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [styleSheet];

    this.shadowRoot.querySelector("#launcher-load-app").addEventListener("click", () => {
      const appPath = this.shadowRoot.querySelector("#launcher-app-path").value;
      System.loadApp(appPath);
    });
  }
}
