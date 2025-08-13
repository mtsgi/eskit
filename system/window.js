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

    const appElement = document.createElement("div");
    appElement.className = "app";
    appElement.id = uuid;
    appElement.textContent = `${appInstance.name} (${uuid})`;

    // 閉じるボタン(仮)
    const closeButton = document.createElement("button");
    closeButton.textContent = "x";
    closeButton.onclick = () => {
      this.system.killApp(uuid);
    };
    appElement.appendChild(closeButton);

    this.rootElement.appendChild(appElement);
    this.#appElements.set(uuid, appElement);
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
