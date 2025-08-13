import WindowSystem from "./window.js";

export default class System {
  #process = new Map();

  constructor() {
    window.System = this;

    this.WindowSystem = new WindowSystem();
  }

  /**
   * アプリモジュールを読み込む
   * @param {string} appPath - 例: "apps/test/main.js"
   * @returns {Promise<string>} - UUID
   */
  async loadApp (appPath) {
    const uuid = this.generateUUID();

    const module = await import(appPath);
    const AppClass = module.default;
    const appInstance = new AppClass();
    this.#process.set(uuid, appInstance);
    this.WindowSystem.open(uuid);

    return uuid;
  }

  /**
   * アプリを終了する
   * @param {*} uuid 
   */
  killApp (uuid) {
    const appInstance = this.getApp(uuid);
    if (appInstance) {
      appInstance.close();
      this.WindowSystem.close(uuid);
      this.#process.delete(uuid);
    }
  }

  /**
   * UUIDからアプリインスタンスを取得する
   * @param {string} uuid - UUID
   * @returns {App|null} - アプリインスタンスまたはnull
   */
  getApp (uuid) {
    return this.#process.get(uuid) || null;
  }

  /**
   * UUIDを生成する
   * @returns {string} - UUID
   */
  generateUUID () {
    return crypto.randomUUID();
  }
}
