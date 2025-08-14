import ESKitWindowElement from "./elements/window.js";

export default class WindowSystem {
  #appElements = new Map();

  constructor() {
    this.system = window.System || null;
    if (!this.system) {
      throw new Error("Systemが初期化されていません");
    }
    this.rootElement = document.createElement("div");
    this.rootElement.id = "window-system";
    document.body.appendChild(this.rootElement);

    // Custom Elementの登録
    customElements.define("eskit-window", ESKitWindowElement);
  }

  /**
   * アプリウィンドウを開く
   * @param {string} uuid - UUID
   */
  open (uuid) {
    const appInstance = this.system.getApp(uuid);
    if (!appInstance) {
      console.error(`アプリが見つかりません: ${uuid}`);
      return;
    }

    const appElement = document.createElement("eskit-window");
    appElement.className = "app";
    appElement.id = uuid;

    this.rootElement.appendChild(appElement);
    this.#appElements.set(uuid, appElement);

    const shadowRoot = appElement.shadowRoot;

    // header要素
    const headerElement = shadowRoot.querySelector(".header");
    headerElement.textContent = `${appInstance.name} (${uuid})`;

    // 閉じるボタン(仮)
    const closeButton = document.createElement("button");
    closeButton.textContent = "x";
    closeButton.onclick = () => {
      this.system.killApp(uuid);
    };
    headerElement.appendChild(closeButton);

    // テンプレート
    const templateElement = document.createElement("div");
    templateElement.className = "app-template";
    templateElement.innerHTML = appInstance.template;
    shadowRoot.appendChild(templateElement);

    // style
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(appInstance.style);
    shadowRoot.adoptedStyleSheets = [styleSheet];
  }

  /**
   * アプリウィンドウを閉じる
   * @param {*} uuid 
   */
  close (uuid) {
    const appElement = this.#appElements.get(uuid);
    if (appElement) {
      this.rootElement.removeChild(appElement);
      this.#appElements.delete(uuid);
    }
  }
}
