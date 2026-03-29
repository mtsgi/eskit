import style    from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

export default class ESKitLauncherElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = template;

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, styleSheet];

    this.shadowRoot.querySelector("#launcher-load-app").addEventListener("click", () => {
      const appPath = this.shadowRoot.querySelector("#launcher-app-path").value;
      System.loadApp(appPath);
    });
  }
}
