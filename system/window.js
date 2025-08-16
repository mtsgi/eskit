import ESKitDesktopElement from "./elements/desktop/main.js";
import ESKitLauncherElement from "./elements/launcher/main.js";
import ESKitWindowElement from "./elements/window/main.js";

export default class ESKitWindowSystem {
  #appElements = new Map();

  constructor() {
    this.system = window.System || null;
    if (!this.system) {
      throw new Error("Systemが初期化されていません");
    }

    // Custom Elementの登録
    customElements.define("eskit-window", ESKitWindowElement);
    customElements.define("eskit-launcher", ESKitLauncherElement);
    customElements.define("eskit-desktop", ESKitDesktopElement);

    this.desktopElement = document.createElement("eskit-desktop");
    document.body.appendChild(this.desktopElement);

    const launcher = document.createElement("eskit-launcher");
    this.desktopElement.appendChild(launcher);
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

    this.desktopElement.appendChild(appElement);
    this.#appElements.set(uuid, appElement);

    const shadowRoot = appElement.shadowRoot;

    // header要素
    const headerElement = shadowRoot.querySelector(".app-header");
    headerElement.textContent = `${appInstance.name} (${uuid})`;

    // 閉じるボタン(仮)
    const closeButton = document.createElement("button");
    closeButton.textContent = "x";
    closeButton.onclick = () => {
      this.system.closeApp(uuid);
    };
    headerElement.appendChild(closeButton);

    // テンプレート
    const templateElement = document.createElement("div");
    templateElement.className = "app-template";
    templateElement.innerHTML = appInstance.template;
    shadowRoot.appendChild(templateElement);

    // style
    if (appInstance.style) {
      const styleSheet = new CSSStyleSheet();
      styleSheet.replaceSync(appInstance.style);
      shadowRoot.adoptedStyleSheets.push(styleSheet);
    }
  }

  /**
   * アプリウィンドウを閉じる
   * @param {*} uuid 
   */
  close (uuid) {
    const appElement = this.#appElements.get(uuid);
    if (appElement) {
      this.desktopElement.removeChild(appElement);
      this.#appElements.delete(uuid);
    }
  }
}
