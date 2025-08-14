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
      <style>
        :host {
          display: flex;
          flex-wrap: wrap;
        }
      </style>
      <input type="text" id="appPathInput" value="apps/welcome/main.js">
      <button id="loadAppButton">Load</button>
    `;

    this.shadowRoot.querySelector("#loadAppButton").addEventListener("click", () => {
      const appPath = this.shadowRoot.querySelector("#appPathInput").value;
      System.loadApp(appPath);
    });
  }
}
