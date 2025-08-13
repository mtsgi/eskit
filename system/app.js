export default class App {
  constructor () {
    this.name = this.constructor.name || "(not_set)";
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
