export default class ESKitApp {
  constructor () {
    this.name = this.constructor.name || "(not_set)";
    this.template = this.constructor.template || "(no_template)";
    this.style = this.constructor.style || null;
    this.initialize();
  }

  /**
   * 初期化処理
   */
  initialize() {
    console.log(`Initializing app: ${this.constructor.name}`);
  }

  /**
   * 終了処理
   */
  close () {
    console.log(`Closing app: ${this.constructor.name}`);
  }
}
