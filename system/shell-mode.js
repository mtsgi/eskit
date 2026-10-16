/**
 * ESKitShellMode — シェル全体の動作モードを管理する。
 *
 * モード:
 *   "desktop" — 複数ウィンドウが自由に配置される PC スタイル
 *   "mobile"  — 1 画面 1 アプリ + ドロワーのスマートフォンスタイル
 *
 * MediaQuery (max-width: 768px) でビューポート変化を自動検出し、
 * System.setShellMode() で明示的に上書きすることもできる。
 * モード変更時は "shell:mode-changed" イベントをバスに発行する。
 */

export const ShellMode = Object.freeze({
  DESKTOP: "desktop",
  MOBILE:  "mobile",
});

export default class ESKitShellMode {
  static DESKTOP = ShellMode.DESKTOP;
  static MOBILE  = ShellMode.MOBILE;

  #current;
  #mq     = window.matchMedia("(max-width: 768px)");
  #locked = false; // true のとき MediaQuery による自動切替を停止

  constructor() {
    this.#current = this.#detect();
    this.#mq.addEventListener("change", () => {
      if (!this.#locked) this.#apply(this.#detect());
    });
  }

  /** 現在のモード文字列 */
  get current()   { return this.#current; }
  get isDesktop() { return this.#current === ShellMode.DESKTOP; }
  get isMobile()  { return this.#current === ShellMode.MOBILE; }
  /** MediaQuery の自動検出がロックされているかどうか */
  get isLocked()  { return this.#locked; }

  /**
   * モードを明示的に設定する。
   * 一度手動設定すると MediaQuery による自動切替は停止する。
   * @param {"desktop"|"mobile"} mode
   */
  set(mode) {
    if (!Object.values(ShellMode).includes(mode)) {
      throw new Error(`[ESKitShellMode] Unknown mode: "${mode}"`);
    }
    this.#locked = true;
    this.#apply(mode);
  }

  /**
   * MediaQuery による自動切替を再開し、現在のビューポートに応じたモードに戻す。
   */
  unlock() {
    this.#locked = false;
    this.#apply(this.#detect());
  }

  #detect() {
    return this.#mq.matches ? ShellMode.MOBILE : ShellMode.DESKTOP;
  }

  #apply(mode) {
    if (mode === this.#current) return;
    const prev = this.#current;
    this.#current = mode;
    // System が初期化済みであればイベントを発行
    window.System?.events.emit("shell:mode-changed", { mode, prev });
  }
}
